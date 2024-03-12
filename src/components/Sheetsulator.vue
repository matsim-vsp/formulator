<template lang="pug">
#app
  .working(v-if="isWorking")
    h1 creating pdf...

  .top-panel(:class="{'is-working': isWorking}")
    h1.center {{ formConfig.title }}

  .leftpanel(:class="{'is-working': isWorking}")
    .xsection
      h2.center Google Sheet
      p Enter existing Google Sheet URL:
      input.input.is-small(v-model="sheetURL")
      .thing(style="margin-left: auto")
        button.button.is-small(style="margin-left: auto" @click="loadSheet") Load data ↯
      p or&nbsp;
        a(target="_blank" :href="copyURL") create new sheet from template...

    .xsection(v-for="section in sections")
      h2.center {{ section }}
      .row(v-for="[field, details] of sectionFields(section)")
        .row-label {{ field }}

        .control(v-if="typeof(details.default) =='boolean'")
          label.checkbox.row-entry()
              input(type="checkbox" v-model="answers[field]")
        .control(v-else-if="details.multiline")
          textarea.textarea.is-small.row-entry(
            v-model="answers[field]" rows="2"
          )
        .control(v-else)
          input.input.is-small.row-entry( v-model="answers[field]")

  .rightpanel(:class="{'is-working': isWorking}")
    canvas#png-image

  .bottompanel(:class="{'is-working': isWorking}")
    button.button.is-small.is-warning(:disabled="isWorking" @click="saveDraft") Save as Draft
    button.button.is-small.is-link(:disabled="isWorking" @click="buildPDF") Download PDF
</template>

<script lang="ts">
import { debounce } from 'lodash-es'
import { PDFDocument, PageSizes } from 'pdf-lib'
import YAML from 'yaml'
import Papaparse from 'papaparse'

const BASE_URL = import.meta.env.BASE_URL
const PIXELRATIO = window.devicePixelRatio

interface LocalData {
  answers: any
  ctx: CanvasRenderingContext2D | null
  dimensions: number[]
  cleanImage: any
  debouncedUpdateForm: any
  isWorking: boolean
  formConfig: any
  sheetURL: string
  entries: any[]
  purpose: string
}

export default {
  name: 'App',
  components: {},
  data() {
    return {
      answers: {},
      cleanImage: null,
      ctx: null,
      dimensions: [0, 0],
      debouncedUpdateForm: {} as any,
      isWorking: false,
      formConfig: {} as any,
      sheetURL: '',
      entries: [],
      purpose: '',
    } as LocalData
  },
  props: {},
  async mounted() {
    this.debouncedUpdateForm = debounce(this.updateForm, 200)

    const filename = this.$route.params.sheet + '.yaml'
    const raw = await (await fetch(BASE_URL + `forms/${filename}`)).text()
    const yaml = await YAML.parse(raw)
    this.formConfig = yaml

    if (this.$route.query?.purpose) {
      this.purpose = '' + this.$route.query.purpose
    }

    this.setInitialValues()
    this.insertImage()
  },
  watch: {
    answers: {
      handler(newAnswers, oldAnswers) {
        this.debouncedUpdateForm()
      },
      deep: true,
    },
  },
  computed: {
    sections() {
      const { tables, title, image, sheet, ...sections } = this.formConfig
      return Object.keys(sections)
    },
    copyURL() {
      const url = `https://docs.google.com/spreadsheets/d/${this.formConfig.sheet}/copy`
      return url
    },
  },
  methods: {
    async loadSheet() {
      const rootURL = this.sheetURL.slice(0, this.sheetURL.lastIndexOf('/'))
      // just
      const csvURL = rootURL + '/gviz/tq?tqx=out:csv&range=A2:J27'
      const raw = await (await fetch(csvURL)).text()

      if (raw.startsWith('<!DOCTYPE')) {
        alert(
          'Cannot access this Google Sheet.\n\nTo grant access, you must go to Google Sheets first and click the "Share" button. Change the permissions from "Restricted" to "Anyone with the link" as viewer.'
        )
        return
      }

      const csv = Papaparse.parse(raw, {
        header: false,
        dynamicTyping: false,
      })
      this.populateSheet(csv.data)
    },
    populateSheet(csv: any[]) {
      const entryConfig = this.formConfig.tables.entries

      let section = 1

      this.entries = []
      for (let i = 0; i < entryConfig.lines; i++) {
        const row = csv[i + (entryConfig.sheetDataStartsAtRow - 1)] as any[]

        // hard-code exceptions for now
        if (!row) break

        if (row[4] && row[4].startsWith('Note: You must')) continue

        if (row[4] == 'Zusammen:') {
          section = 2
        }

        if (row[0] == 'Erklärungen') {
          section = 3
        }

        switch (section) {
          case 1:
            row.forEach((text, j) => {
              this.entries.push({
                x: entryConfig.offsetX[j] + entryConfig.startXY[0],
                y: entryConfig.height * i + entryConfig.startXY[1],
                text,
              })
            })
            break

          case 2:
            row.forEach((text, j) => {
              if (j < 5) return
              this.entries.push({
                x: entryConfig.offsetX[j] + entryConfig.startXY[0],
                y: entryConfig.height * entryConfig.lines + entryConfig.startXY[1],
                text,
              })
            })
            break

          case 3:
          default:
            row.forEach((text, j) => {
              if (j < 4) return
              this.entries.push({
                x: entryConfig.offsetX[j] + entryConfig.startXY[0],
                y: entryConfig.height * i + entryConfig.startXY[1],
                text,
              })
            })

            break
        }
      }
      this.updateForm()
    },
    sectionFields(section: string) {
      const fields = Object.entries(this.formConfig[section]) as any[]
      return fields
    },
    setInitialValues() {
      // default values
      for (const section of this.sections) {
        for (const key in this.formConfig[section]) {
          this.answers[key] = this.formConfig[section][key].default || ''
        }
      }

      // load from saved form
      if (this.$route.params.savedForm) {
        const raw = localStorage.getItem('' + this.$route.params.savedForm) || '{}'
        const details = JSON.parse(raw)
        const { answers, sheetURL } = details
        if (sheetURL) this.sheetURL = sheetURL
        for (const key in answers) {
          this.answers[key] = answers[key]
        }
      }

      if (this.sheetURL) this.loadSheet()
    },

    saveDraft() {
      console.log('SAVE DRAFT', this.$route.params)

      const purpose =
        this.purpose ||
        `${this.entries[0]?.text || ''}/${this.entries[1]?.text || ''} - ${
          this.entries[3]?.text || ''
        }`

      const item = {
        formOrSheet: 'sheet',
        filename: this.$route.params.sheet,
        updated: Date.now(),
        purpose,
      }

      console.log(item)

      const raw = localStorage.getItem('allSaved') ?? '[]'

      const allSaved = JSON.parse(raw) as any[]
      allSaved.unshift(item)

      localStorage.setItem('allSaved', JSON.stringify(allSaved))

      const details = {
        sheetURL: this.sheetURL,
        answers: this.answers,
      }
      localStorage.setItem('' + item.updated, JSON.stringify(details))
      this.$router.back()
    },

    insertImage() {
      const filename = this.$route.params.sheet as string
      const pngFilename = filename + '.png'

      let canvas = document.getElementById('png-image') as HTMLCanvasElement
      let image = new Image()

      image.onload = () => {
        this.cleanImage = image
        this.ctx = canvas.getContext('2d')
        canvas.width = image.width * PIXELRATIO
        canvas.height = image.height * PIXELRATIO
        this.dimensions = [canvas.width, canvas.height]
        this.updateForm()
      }
      image.src = BASE_URL + `/forms/${pngFilename}`
    },
    redrawImage() {
      this.ctx &&
        this.ctx.drawImage(this.cleanImage, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    },
    updateForm() {
      if (!this.ctx) return

      this.redrawImage()

      const fontSize = (0.8 * this.dimensions[1]) / 100
      this.ctx.font = `bold ${fontSize}px Arial`
      this.ctx.fillStyle = '#008'

      // fill the whole form with fake data for alignment
      if ('test' in this.$route.query) {
        let i = 1
        for (const section of this.sections) {
          for (const key of Object.keys(this.formConfig[section])) {
            this.answers[key] = '' + i
            i++
          }
        }
      }

      // google sheet cells
      for (const cell of this.entries) {
        const x = (cell.x * this.dimensions[0]) / 210.0
        const y = (cell.y * this.dimensions[1]) / 297.0
        this.ctx && this.ctx.fillText(cell.text, x, y)
      }

      // form fields
      for (const [key, value] of Object.entries(this.answers)) {
        for (const section of this.sections) {
          if (this.formConfig[section][key]) {
            const element = this.formConfig[section][key]
            const x = (element.x * this.dimensions[0]) / 210.0
            const y = (element.y * this.dimensions[1]) / 297.0

            if ('test' in this.$route.query) {
              this.ctx.beginPath()
              this.ctx.rect(x, y - 48, 70, 50)
              this.ctx.fillStyle = '#ff88ff77'
              this.ctx.fill()
              this.ctx.fillStyle = '#008'
            }

            // checkbox
            if (typeof value == 'boolean') {
              if (value) this.ctx.fillText('X', x, y)
            } else {
              const lines = (value as string).split('\n')
              lines.forEach((line, i) => {
                if (!this.ctx) return

                if (element.whiteout) {
                  this.ctx.beginPath()
                  const measure = this.ctx.measureText(line)
                  const xx = x - 60
                  const yy = y - 50 + (i * 3 * this.dimensions[1]) / 297.0

                  this.ctx.rect(xx, yy, 100 + measure.width, 80)
                  this.ctx.fillStyle = 'white'
                  this.ctx.fill()
                  this.ctx.fillStyle = '#008'
                }

                this.ctx && this.ctx.fillText(line, x, y + (i * 3 * this.dimensions[1]) / 297.0)
              })
            }
          }
        }
      }
    },
    buildPDF() {
      this.isWorking = true

      setTimeout(async () => {
        if (!this.ctx) return

        const byteData = this.ctx.canvas.toDataURL('image/png')
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage(PageSizes.A4)

        const pngImage = await pdfDoc.embedPng(byteData)

        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight(),
        })

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save()

        const blobURL = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))

        let element = document.createElement('a')
        element.setAttribute('href', blobURL)
        element.setAttribute('download', this.formConfig.title + '.pdf')
        element.style.display = 'none'

        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        this.isWorking = false
      }, 100)
    },
  },
}
</script>

<style lang="scss">
@import '~/bulma/css/bulma.min.css';
@import '@/style.scss';

#app {
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 450px 2fr;
  gap: 0.25rem;
  margin: 0 0;
  padding: 0 0;
  color: var(--text);
  width: 100%;
}

.is-working {
  opacity: 0.7;
  filter: blur(5px);
  // filter: brightness(20%);
  transition: opacity 0.1s ease-out;
}

.top-panel {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  padding: 2.5rem 2rem;
}

.leftpanel {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 1.5rem;
}

.rightpanel {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  max-height: 100%;
  position: relative;
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

.working {
  grid-row: 1/3;
  grid-column: 1/3;
  text-align: center;
  margin: auto auto;
  background-color: #ffc;
  padding: 1rem 3rem;
  border: 1px solid blue;
  z-index: 1;
}
</style>
