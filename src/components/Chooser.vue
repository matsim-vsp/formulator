<template lang="pug">
.chooser
  .top-panel(v-if="!formConfig.title" :class="{'is-working': isWorking}")
    h1 VSP Formulator

    .new-section
      h2 Start new form:
      .forms
        .form(v-for="filename in Object.keys(allForms)" :key="filename")
          .thumbnail(@click="openForm(filename)")
            img(:src="imageURL(filename)")
            p.chooser-link {{ allForms[filename].title }}

    .new-section
      h2 &nbsp;Saved forms:
      .saved-forms
        .saved-form(v-for="form in savedForms" :key="form.updated"
          @click="openSavedForm(form)"
        )
          p.flex
            b {{ new Date(form.updated).toDateString() }} {{ new Date(form.updated).toLocaleTimeString() }}
            p {{ form.purpose || form.filename }}

          button.button.is-small.is-danger.is-outlined(@click.stop="deleteForm(form.updated)") Delete
</template>

<script lang="ts">
import YAML from 'yaml'

const BASE_URL = import.meta.env.BASE_URL
const PIXELRATIO = window.devicePixelRatio

console.log({ PIXELRATIO })

interface SavedForm {
  formOrSheet: string
  filename: string
  content: any
  updated: string
  purpose?: string
}

interface LocalData {
  formConfig: any | null
  answers: any
  ctx: CanvasRenderingContext2D | null
  dimensions: number[]
  cleanImage: any
  debouncedUpdateForm: any
  isWorking: boolean
  allForms: { [filename: string]: any }
  savedForms: SavedForm[]
}

export default {
  name: 'Chooser',
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
      savedForms: [],
    } as LocalData
  },
  props: {},
  async mounted() {
    await this.getAllForms()
    await this.getSavedForms()
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

    async getSavedForms() {
      const raw = localStorage.getItem('allSaved') || '[]'
      const forms = JSON.parse(raw)
      this.savedForms = forms
    },

    imageURL(filename: string) {
      return BASE_URL + `forms/${this.allForms[filename].image}`
    },

    openForm(filename: string) {
      const which = this.allForms[filename].sheet ? 'sheet' : 'form'
      const url = `/${which}/${filename}`
      this.$router.push(url)
    },

    openSavedForm(form: SavedForm) {
      console.log(JSON.stringify(form))
      const url = `/${form.formOrSheet}/${form.filename}/${form.updated}`
      this.$router.push(url)
    },

    deleteForm(updated: string) {
      console.log('DELETE!!!', updated)
      const remaining = this.savedForms.filter(f => f.updated !== updated)
      this.savedForms = remaining
      localStorage.setItem('allSaved', JSON.stringify(this.savedForms))
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

.new-section {
  margin: 1rem 0 2rem 0;
}

.saved-forms {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.saved-form {
  padding: 0.25rem 0.5rem;
  display: flex;
  border-radius: 4px;
}

.saved-form:hover {
  background-color: white;
}

.flex {
  flex: 1;
}
</style>
