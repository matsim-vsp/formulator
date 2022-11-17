<script lang="ts">
import YAML from 'yaml'
import { PDFDocument, PageSizes, StandardFonts, rgb } from 'pdf-lib'
import Vue from 'vue'

import config from '@/assets/genehmigung.yaml?raw'
import pngImage from '@/assets/genehmigung.png'

const PIXELRATIO = window.devicePixelRatio

console.log({PIXELRATIO})

export default {
  name: 'Formulator',
  components: {},
  data() {
    return {
      formConfig: {} as any,
      answers: {} as any,
      ctx: null as any,
      dimensions: [0,0],
      cleanImage: null as any
    }
  },
  props: {  },
   async mounted() {
    this.formConfig = await YAML.parse(config);
    console.log(this.formConfig)


    this.setInitialValues()
    this.insertImage()
    this.updateForm()

  },
  watch: {
    answers: {
      handler(newAnswers, oldAnswers) {
      this.updateForm()
      }, deep: true
    }
  },
  computed: {
    sections() {
      const {title, image, ...sections} = this.formConfig
      return Object.keys(sections)
    }
  },
  methods: {
    setInitialValues() {
      const answers = {} as any
      for (const section of this.sections) {
        for (const key in this.formConfig[section]) {
          this.answers[key] = this.formConfig[section][key].default || ''
        }
      }
      console.log({answers})
    },
    async buildPDF() {

      const byteData = this.ctx.canvas.toDataURL("image/jpeg", 0.85);

      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage(PageSizes.A4)

      const pngImage = await pdfDoc.embedJpg(byteData)

      page.drawImage(pngImage, {
        x:0, y:0, width:page.getWidth(), height: page.getHeight()
      })

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save()

      const blobURL = URL.createObjectURL(
        new Blob([pdfBytes], { type: 'application/pdf' })
      )

      let element = document.createElement('a')
      element.setAttribute('href', blobURL)
      element.setAttribute('download', 'form.pdf')
      element.style.display = 'none'

      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

    },
    updateForm() {
      if (!this.ctx) return

      this.redrawImage()

      this.ctx.font=`bold ${ 15 * PIXELRATIO }px Arial`
      this.ctx.fillStyle='#008'

      // fill the whole form with fake data for alignment
      if (location.search.indexOf('test') > -1) {
        let i = 1
        for (const section of this.sections) {
          for (const [key, entry] of Object.entries(this.formConfig[section])) {
            this.answers[key] = '' + i
            i++
          }
        }
      }

      for (const [key,value] of Object.entries(this.answers)) {
        for (const section of this.sections) {
          if (this.formConfig[section][key]) {
            const element = this.formConfig[section][key]
            const x = element.x * this.dimensions[0] / 210.0
            const y = element.y * this.dimensions[1] / 297.0

            // checkbox
            if (typeof(value) == 'boolean') {
              if (value) this.ctx.fillText('X', x,y)
            } else {
              const lines = (value as string).split('\n')
              lines.forEach((line,i) => {
                this.ctx.fillText(line, x,y + i*3*this.dimensions[1] / 297.0)
              })
            }
          }
        }
      }
    },
  insertImage() {
    let canvas = document.getElementById('png-image') as HTMLCanvasElement
    let image = new Image()
    image.onload = () => {
      this.cleanImage = image
      this.ctx = canvas.getContext('2d')
      canvas.width = image.width * PIXELRATIO
      canvas.height = image.height * PIXELRATIO
      this.dimensions = [canvas.width, canvas.height]
      // this.ctx.drawImage(image,0,0,canvas.width,canvas.height)
      this.updateForm()
    }
    image.src = pngImage
  },
  redrawImage() {
    // if (!this.ctx) return
    this.ctx.drawImage(this.cleanImage,0,0,this.ctx.canvas.width,this.ctx.canvas.height)

  }
}
}
</script>

<template lang="pug">
.main-app
  .top-panel
    h1.center {{ formConfig.title }}

  .leftpanel
    .xsection(v-for="section in sections")
      h2.center {{ section }}
      .row(v-for="[rowLabel, rowDetails] of Object.entries(formConfig[section])")
        .row-label {{ rowLabel }}

        .control(v-if="typeof(rowDetails.default) =='boolean'")
          label.checkbox.row-entry()
              input(type="checkbox" v-model="answers[rowLabel]")
        .control(v-else-if="rowDetails.multiline")
          textarea.textarea.is-small.row-entry(
            v-model="answers[rowLabel]" rows="2"
          )
        .control(v-else)
          input.input.is-small.row-entry( v-model="answers[rowLabel]")


  .rightpanel
    canvas#png-image

  .bottompanel
    button.button.is-small.is-link(@click="buildPDF") Download PDF

</template>

<style scoped lang="scss">
.main-app {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  margin: 0 0;
  padding: 0 0;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 450px 2fr;
  gap: 0.25rem;
}

.top-panel {
  // margin: 0 auto;
  grid-column: 1 / 3;
  padding: 2.5rem 2rem;
}

.leftpanel {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  // overflow-y: auto;
  padding: 1rem 1.5rem;
}

.rightpanel {
  grid-row: 2 / 3;
  grid-column: 2 / 3;
  // padding: 1rem 1rem;
  max-height: 100%;
  position: relative;
  // margin: 0rem 1rem 1rem 1rem;
  // background-color: cyan;
  overflow-y: auto;
  margin: 0rem 1rem 1rem 1rem;
  display: flex;
  flex-direction: column;

}


#png-image {
  flex: 1;
  position: absolute;
  top: 0;
  bottom: 0;
  max-width: 100%;
  border: 1px solid #88c;
}

.row {
  display: flex;
  margin-right: auto;
  margin-bottom: 0.5rem;
  max-width: 400px;
  font-size: 1rem;
}

.row-label {
  flex: 1;
  margin: auto 0.5rem auto 0;
  text-align: right;
  line-height: 1.1rem;
}

.row-entry {
  width: 180px;
}
.xsection {
  margin-bottom: 2rem;
}

.xsection h2 {
  grid-column: 1 / 3;
}

h2 {
  font-size: 1.8rem;
  margin: 0rem 0 1rem 0;
  line-height: 2.1rem;

}

.right {
  text-align: right;
}

.center {
  text-align: center;
}

.bottompanel {
  margin: 0 auto;
}

.button {
  margin: 0.5rem 0.5rem;
}
</style>
