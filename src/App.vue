<script lang="ts">
import Formulator from './components/Formulator.vue';

export default {
  name: 'MyApp',
  components: { Formulator },
};
</script>

<template lang="pug">
Formulator
</template>

<style lang="scss">
@import "~/bulma/css/bulma.min.css";
@import '@/style.scss';

#app {
  display: grid;
  color: var(--text);
  margin: 0 0;
  padding: 0 0;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

</style>
