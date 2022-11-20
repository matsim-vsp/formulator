<template lang="pug">
.chooser

    .top-panel(v-if="!formConfig.title" :class="{'is-working': isWorking}")
      h1 Select form:
      hr
      .form(v-for="filename in Object.keys(allForms)")
        router-link(:to="`/${allForms[filename].sheet ? 'sheet' : 'form'}/${filename}`") {{ allForms[filename].title }}

</template>

<script lang="ts">
import YAML from 'yaml'

const BASE_URL = import.meta.env.BASE_URL

const PIXELRATIO = window.devicePixelRatio
console.log({ PIXELRATIO })

interface LocalData {
  formConfig: any | null
  answers: any
  ctx: CanvasRenderingContext2D | null
  dimensions: number[]
  cleanImage: any
  debouncedUpdateForm: any
  isWorking: boolean
  allForms: { [filename: string]: any }
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
      formConfig: {} as any,
      debouncedUpdateForm: {} as any,
      isWorking: false,
      allForms: {},
    } as LocalData
  },
  props: {},
  async mounted() {
    await this.getAllForms()
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
      const { title, image, ...sections } = this.formConfig
      return Object.keys(sections)
    },
  },
  methods: {
    async getAllForms() {
      const filenames = await (await fetch(BASE_URL + 'forms.txt')).text()
      filenames.split('\n').forEach(async config => {
        const filename = config.trim()
        if (filename) {
          const raw = await (await fetch(BASE_URL + `forms/${filename}`)).text()
          const yaml = await YAML.parse(raw)
          const key = filename.slice(0, filename.lastIndexOf('.'))
          this.allForms[key] = yaml
        }
      })
      console.log({ ALLFORMS: this.allForms })
    },
  },
}
</script>

<style lang="scss">
@import '~/bulma/css/bulma.min.css';
@import '@/style.scss';

.chooser {
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
