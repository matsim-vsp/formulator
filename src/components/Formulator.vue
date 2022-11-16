<script lang="ts">
import YAML from 'yaml'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

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
    dimensions: [0,0]
    }
  },
  props: {  },
   async mounted() {
    this.formConfig = await YAML.parse(config);
    console.log(this.formConfig)

    this.insertImage()

  },
  computed: {
    sections() {
      const {title, image, ...sections} = this.formConfig
      return Object.keys(sections)
    }
  },
  methods: {
  async buildPDF() {

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create()

    // Embed the Times Roman font
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

    // Add a blank page to the document
    const page = pdfDoc.addPage()

    // Get the width and height of the page
    const { width, height } = page.getSize()

    // Draw a string of text toward the top of the page
    const fontSize = 30
    page.drawText('Creating PDFs in JavaScript is awesome!', {
      x: 50,
      y: height - 4 * fontSize,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0.53, 0.71),
    })

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save()

  },
  gxo(event: any) {
    this.ctx.font=`bold ${ 15*PIXELRATIO }px Arial`
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

    // console.log({dimensions: this.dimensions, answers: this.answers})
    for (const [key,value] of Object.entries(this.answers)) {
      for (const section of this.sections) {
        if (this.formConfig[section][key]) {
          const element = this.formConfig[section][key]
          console.log(element)
          const x = element.x * this.dimensions[0] / 210.0
          const y = element.y * this.dimensions[1] / 297.0
          this.ctx.fillText(value == true ? 'X': value, x,y)

        }
      }
    }

  },
  insertImage() {
    let canvas = document.getElementById('png-image') as HTMLCanvasElement
    // canvas.height=2970
    // canvas.width=2100
    let image = new Image()
    image.onload = () => {
      this.ctx = canvas?.getContext('2d')
      canvas.width = image.width * PIXELRATIO
      canvas.height = image.height * PIXELRATIO
      this.dimensions = [canvas.width, canvas.height]
      this.ctx.drawImage(image,0,0,canvas.width,canvas.height)
    }
    image.src = pngImage
  }
}
}
</script>

<template lang="pug">
h1.center {{ formConfig.title }}
hr
.panels
  .leftpanel
    .xsection(v-for="section in sections")
      h2 {{ section }}
      .row(v-for="[rowLabel, rowDetails] of Object.entries(formConfig[section])")
        .row-label {{ rowLabel }}
        label.checkbox.row-entry(v-if="typeof(rowDetails.default) =='boolean'")
            input(type="checkbox" v-model="answers[rowLabel]")
        input.input.is-small.row-entry(v-else v-model="answers[rowLabel]")
    button.button.is-expanded.is-link(@click="gxo") FILL OUT FORM
    button.button.is-expanded.is-warning(@click="buildPDF") Download

  .rightpanel
    canvas#png-image
</template>

<style scoped lang="scss">

.panels {
  display: flex;
}

.rightpanel {
  margin-left: 1rem;
  flex: 1;
  border: 1px solid #88c;
}

#png-image {
  background-color: yellow;
  width: 100%;
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
  width: 150px;
}
.xsection h2 {
  grid-column: 1 / 3;
}

h2 {
  font-size: 1.8rem;
  margin: 2rem 0 1rem 0;
}

.right {
  text-align: right;
}

.center {
  text-align: center;
}
</style>
