import Vue from 'vue'
import LetterButton from './LetterButton'
import HangmanGame from './HangmanGame'
import CrosswordGame from './CrosswordGame'

const Components = {
  LetterButton,
  HangmanGame,
  CrosswordGame
}

Object.keys(Components).forEach(name => {
  Vue.component(name, Components[name])
})

export default Components