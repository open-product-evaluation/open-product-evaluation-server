<template>
  <div class="image"
       :style="style">
    <span v-if="!image || image && image.url === ''"
          class="image__text">
      no image
    </span>
    <div v-if="hasSlot"
         class="image__overlay">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageContainer',
  props: {
    image: {
      type: Object,
      default: () => ({ url: '' }),
    },
  },
  computed: {
    hasSlot() {
      return !!this.$slots.default
    },
    style() {
      const backgroundImage = this.image && this.image.url !== '' ? this.image.url : null
      let styles

      if (backgroundImage !== null) {
        styles = { backgroundImage: `url(${backgroundImage})` }
      } else {
        styles = {}
      }

      return styles
    },
  },
}
</script>

<style scoped="true" lang="scss">
  .image {
    padding-top: 50%;
    background-color: lightgrey;
    border-radius: .25rem;
    background-size: cover;
    background-position: center;
    position: relative;    
    border: 1px solid #ced4da;

    .image__text {
      position: absolute;
      top: 0;
      text-align: center;
      display: flex;
      width: 100%;
      height: 100%;
      justify-content: center;
      flex-direction: column;
      color: grey;
    }

    .image__overlay {
      position: absolute;
      background-color: rgba(0, 0, 0, 0.5);
      top: 0;
      left: 0;
      display: none;
      width: 100%;
      height: 100%;
      justify-content: center;
      align-items: center;
    }

    &:hover .image__overlay {
      display: flex;
    }
  }
</style>
