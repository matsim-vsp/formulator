<template lang="pug">
router-view
</template>

<script lang="ts">
export default {
  components: {},
  data() {
    return {
      currentPath: window.location.hash,
      routes: {} as any,
      formConfig: {} as any,
      currentView: null as any,
    }
  },
  methods: {},
}
</script>
