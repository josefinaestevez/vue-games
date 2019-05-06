import Vue from 'vue'
import LetterButton from './LetterButton'
import HangmanGame from './HangmanGame'

const Components = {
  LetterButton,
  HangmanGame
}

Object.keys(Components).forEach(name => {
  Vue.component(name, Components[name])
})

export default Components