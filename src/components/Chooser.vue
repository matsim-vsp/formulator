<template lang="pug">
.chooser

    .top-panel(v-if="!formConfig.title" :class="{'is-working': isWorking}")
      h1 VSP Formulator
      h2 Select form:
      hr
      .forms
        .form(v-for="filename in Object.keys(allForms)" :key="filename")
          .thumbnail(@click="openForm(filename)")
            img(:src="imageURL(filename)")
            p.chooser-link {{ allForms[filename].title }}

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

      for (const config of filenames.split('\n')) {
        const filename = config.trim()
        if (filename) {
          const raw = await (await fetch(BASE_URL + `forms/${filename}`)).text()
          const yaml = await YAML.parse(raw)
          const key = filename.slice(0, filename.lastIndexOf('.'))
          this.allForms[key] = yaml
        }
      }
      console.log({ ALLFORMS: this.allForms })
    },
    imageURL(filename: string) {
      return BASE_URL + `forms/${this.allForms[filename].image}`
    },
    openForm(filename: string) {
      const which = this.allForms[filename].sheet ? 'sheet' : 'form'
      const url = `/${which}/${filename}`
      this.$router.push(url)
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
  position: absolute;
  left: 0;
  right: 0;
}

.top-panel {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  padding: 2.5rem 2rem;
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

.chooser-link {
  margin-top: auto;
  background-color: white;
  transition: background-color 0.1s;
  padding: 8px 12px;
  font-weight: bold;
  line-height: 1.4rem;
}

.forms {
  display: grid;
  grid-template-columns: repeat(auto-fit, 220px);
  gap: 24px;
}

.form {
  background-color: white;
  padding: 5px;
}

.form:hover {
  filter: drop-shadow(0 0 16px #00000030);
  cursor: pointer;
}

img {
  border: 1px solid #22c56b;
}
</style>
