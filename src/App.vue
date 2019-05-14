<template>
  <div id="app">
    <b-container>
      <h2>Vue Games</h2>
      <p class="text-left m-4">Different word games mades as separated components to be reused.
  This npm package allows you to include this components in your vue application. For now it only have a hangman game</p>
      <b-card no-body>
        <b-tabs card>
          <b-tab title="Hangman" active>
            <hangman-game />
          </b-tab>
          <!-- <b-tab title="Tab 2">
            <b-card-text>Tab Contents 2</b-card-text>
          </b-tab> -->
        </b-tabs>
      </b-card>
    </b-container>
  </div>
</template>

<script>
import HangmanGame from './components/HangmanGame.vue'

export default {
  name: 'app',
  components: {
    HangmanGame
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
