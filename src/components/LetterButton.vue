<template>
  <button
    class='keyboard-row-letter'
    :id='letter'
    :disabled='disabled'
    @click='clicked()'
  >
    {{ letter }}
  </button>
</template>
<script>
  export default {
    props: ["letter", "gameOver", "twoPlayers"],
    data: function() {
      return {
        disabled: false
      }
    },
    // disable button on click, and send 'check' event to run check() in main vue instance
    methods: {
      clicked: function() {
        this.disabled = true
        this.$emit("check")
      }
    },
    watch: {
      // disable all buttons on game over; re-enable all buttons on restart
      gameOver: function (newValue) {
        this.disabled = newValue
      }
    }
  }
</script>