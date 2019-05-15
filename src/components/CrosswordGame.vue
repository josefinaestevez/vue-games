<template>
  <!-- I've used this template as guide:
  https://codepen.io/adrianroworth/pen/OpeyZq
  54 3544 570127 -->
  <div class="crossword-container" ref="crossword-container">
    <b-row v-if="showPlayAgain" align-h="center">
      <b-button
        size="sm"
        class="m-3"
        @click="playAgain"
      >
        Play Again
      </b-button>
    </b-row>
    <div
      v-if="grid"
      class="crossword-board-container"
    >
      <b-row>
        <b-col :class="[ smallContainer ? 'col-12' : 'col-7' ]">
          <div class="crossword-board">
            <template
              v-for="(row, index1) in grid"
            >
              <!-- ROW -->
              <template
                v-for="(item, index2) in row"
              >
                <input
                  v-if="item"
                  :key="`row-${index1}-${index2}`"
                  :id="index(index1, index2)"
                  class="crossword-board__item"
                  :class="{'crossword-board__item--valid': equalsLetters(form[index1][index2], item.char)}"
                  type="text"
                  minlength="1"
                  maxlength="1"
                  :pattern="pattern(item.char)"
                  required="required"
                  v-model="form[index1][index2]"
                />
                <span
                  v-else
                  :key="`row-${index1}-${index2}`"
                  :id="index(index1, index2)"
                  class="crossword-board__item--blank"
                />
              </template>
              <!-- /ROW -->
            </template>
          </div>
        </b-col>
        <b-col :class="[ smallContainer ? ['col-12', 'px-5', 'my-5'] : 'col-4' ]">
          <div class="crossword-clues">
            <dl
              v-if="across.length > 0"
              class="crossword-clues__list crossword-clues__list--across"
            >
              <dt class="crossword-clues__list-title">{{ this.across }}</dt>
              <dd
                class="crossword-clues__list-item"
                v-for="(word, index) in acrossWords"
                :key="`across-${word.word}-${index}`"
              >
                <span class="hightlighted">{{index+1}}. {{word.clue}} ({{word.word}})</span>
              </dd>
            </dl>
            <dl
              v-if="down.length > 0"
              class="crossword-clues__list crossword-clues__list--down"
            >
              <dt class="crossword-clues__list-title">{{ this.down }}</dt>
              <dd
                class="crossword-clues__list-item"
                v-for="(word, index) in downWords"
                :key="`down-${word.word}-${index}`"
              >
                <span class="hightlighted">{{index+1}}. {{word.clue}} ({{word.word}})</span>
              </dd>
            </dl>
          </div>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
// Each cell on the crossword grid is null or one of these
function CrosswordCell (letter) {
  this.char = letter // the actual letter for the cell on the crossword
  // If a word hits this cell going in the "across" direction, this will be a CrosswordCellNode
  this.across = null 
  // If a word hits this cell going in the "down" direction, this will be a CrosswordCellNode
  this.down = null
}

// You can tell if the Node is the start of a word (which is needed if you want to number the cells)
// and what word and clue it corresponds to (using the index)
function CrosswordCellNode (is_start_of_word, index) {
  this.is_start_of_word = is_start_of_word
  this.index = index // use to map this node to its word or clue
}

function WordElement (word, index) {
  this.word = word // the actual word
  this.index = index // use to map this node to its word or clue
}

function Crossword (words_in, clues_in) {
  var GRID_ROWS = 50
  var GRID_COLS = 50
  // This is an index of the positions of the char in the crossword (so we know where we can potentially place words)
  // example {"a" : [{'row' : 10, 'col' : 5}, {'row' : 62, 'col' :17}], {'row' : 54, 'col' : 12}], "b" : [{'row' : 3, 'col' : 13}]} 
  // where the two item arrays are the row and column of where the letter occurs
  var char_index = {}	

  // these words are the words that can't be placed on the crossword
  var bad_words

  // returns the crossword grid that has the ratio closest to 1 or null if it can't build one
  this.getSquareGrid = function (max_tries) {
    var best_grid = null
    var best_ratio = 0
    for (var i = 0; i < max_tries; i++) {
      var a_grid = this.getGrid(1)
      if(a_grid == null) continue
      var ratio = Math.min(a_grid.length, a_grid[0].length) * 1.0 / Math.max(a_grid.length, a_grid[0].length)
      if (ratio > best_ratio) {
        best_grid = a_grid
        best_ratio = ratio
      }

      if (best_ratio == 1) break
    }
    return best_grid
  }

  // returns an abitrary grid, or null if it can't build one
  this.getGrid = function(max_tries){
    for (var tries = 0; tries < max_tries; tries++) {
      clear(); // always start with a fresh grid and char_index
      // place the first word in the middle of the grid
      var start_dir = randomDirection()
      var r = Math.floor(grid.length / 2)
      var c = Math.floor(grid[0].length / 2)
      var word_element = word_elements[0]
      if (start_dir == "across") {
        c -= Math.floor(word_element.word.length/2)
      } else {
        r -= Math.floor(word_element.word.length/2)
      }

      if (canPlaceWordAt(word_element.word, r, c, start_dir) !== false) {
        placeWordAt(word_element.word, word_element.index, r, c, start_dir)
      } else {
        bad_words = [word_element]
        return null
      }

      // start with a group containing all the words (except the first)
      // as we go, we try to place each word in the group onto the grid
      // if the word can't go on the grid, we add that word to the next group 
      var groups = []
      let word_has_been_added_to_grid
      groups.push(word_elements.slice(1))
      for (var g = 0; g < groups.length; g++) {
        word_has_been_added_to_grid = false
        // try to add all the words in this group to the grid
        for (var i = 0; i < groups[g].length; i++) {
          word_element = groups[g][i]
          var best_position = findPositionForWord(word_element.word)
          if (!best_position) { 
            // make the new group (if needed)
            if (groups.length - 1 == g) groups.push([])
            // place the word in the next group
            groups[g+1].push(word_element)
          } else {
            r = best_position["row"], c = best_position["col"]
            var dir = best_position['direction']
            placeWordAt(word_element.word, word_element.index, r, c, dir)
            word_has_been_added_to_grid = true
          }
        }
        // if we haven't made any progress, there is no point in going on to the next group
        if(!word_has_been_added_to_grid) break
      }
      // no need to try again
      if (word_has_been_added_to_grid) return minimizeGrid()
    }

      bad_words = groups[groups.length - 1]
      return null
  }

  // returns the list of WordElements that can't fit on the crossword
  this.getBadWords = function(){
    return bad_words;
  }

  // get two arrays ("across" and "down") that contain objects describing the
  // topological position of the word (e.g. 1 is the first word starting from
  // the top left, going to the bottom right), the index of the word (in the
  // original input list), the clue, and the word itself
  this.getLegend = function(grid){
    var groups = {"across" : [], "down" : []};
    var position = 1;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        var cell = grid[r][c];
        var increment_position = false
        // check across and down
        for (var k in groups) {
          // does a word start here? (make sure the cell isn't null, first)
          if (cell && cell[k] && cell[k]['is_start_of_word']) {
            var index = cell[k]['index']
            groups[k].push({"position" : position, "index" : index, "clue" : clues_in[index], "word" : words_in[index]})
            increment_position = true
          }
        }

        if (increment_position) position++
      }
    }
    return groups;
  }

  // move the grid onto the smallest grid that will fit it
  var minimizeGrid = function(){
    // find bounds
    var r_min = GRID_ROWS-1, r_max = 0, c_min = GRID_COLS-1, c_max = 0
    for (var r = 0; r < GRID_ROWS; r++) {
      for (var c = 0; c < GRID_COLS; c++) {
        var cell = grid[r][c]
        if (cell != null) {
          if (r < r_min) r_min = r
          if (r > r_max) r_max = r
          if (c < c_min) c_min = c
          if (c > c_max) c_max = c
      }
      }
    }
    // initialize new grid
    var rows = r_max - r_min + 1
    var cols = c_max - c_min + 1
    var new_grid = new Array(rows)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        new_grid[r] = new Array(cols)
      }
    }

    // copy the grid onto the smaller grid
    for (let r = r_min, r2 = 0; r2 < rows; r++, r2++) {
      for (let c = c_min, c2 = 0; c2 < cols; c++, c2++) {
         new_grid[r2][c2] = grid[r][c]
      }
    }

    return new_grid
  }

  // helper for placeWordAt();
  var addCellToGrid = function (word, index_of_word_in_input_list, index_of_char, r, c, direction) {
    var char = word.charAt(index_of_char)
    if (grid[r][c] == null) {
        grid[r][c] = new CrosswordCell(char)

        // init the char_index for that character if needed
        if (!char_index[char]) char_index[char] = []

        // add to index
        char_index[char].push({"row" : r, "col" : c})
    }

    var is_start_of_word = index_of_char == 0
    grid[r][c][direction] = new CrosswordCellNode(is_start_of_word, index_of_word_in_input_list)

  }

  // place the word at the row and col indicated (the first char goes there)
  // the next chars go to the right (across) or below (down), depending on the direction
  var placeWordAt = function (word, index_of_word_in_input_list, row, col, direction) {
    if (direction == "across") {
      for (let c = col, i = 0; c < col + word.length; c++, i++) {
        addCellToGrid(word, index_of_word_in_input_list, i, row, c, direction)
      }
    } else if (direction == "down") {
      for (let r = row, i = 0; r < row + word.length; r++, i++) {
        addCellToGrid(word, index_of_word_in_input_list, i, r, col, direction)
      }
    } else {
      throw "Invalid Direction"
    }
  }

  // you can only place a char where the space is blank, or when the same
  // character exists there already
  // returns false, if you can't place the char
  // 0 if you can place the char, but there is no intersection
  // 1 if you can place the char, and there is an intersection
  var canPlaceCharAt = function(char, row, col){
    // no intersection
    if (grid[row][col] == null) return 0
    // intersection!
    if (grid[row][col]['char'] == char) return 1

    return false
  }

  // determines if you can place a word at the row, column in the direction
  var canPlaceWordAt = function (word, row, col, direction) {
    // out of bounds
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[row].length) return false
    
    var intersections
    
    if (direction == "across") {
      // out of bounds (word too long)
      if (col + word.length > grid[row].length) return false
      // can't have a word directly to the left
      if (col - 1 >= 0 && grid[row][col - 1] != null) return false
      // can't have word directly to the right
      if (col + word.length < grid[row].length && grid[row][col+word.length] != null) return false

      // check the row above to make sure there isn't another word
      // running parallel. It is ok if there is a character above, only if
      // the character below it intersects with the current word
      for (let r = row - 1, c = col, i = 0; r >= 0 && c < col + word.length; c++, i++) {
        let is_empty = grid[r][c] == null
        let is_intersection = grid[row][c] != null && grid[row][c]['char'] == word.charAt(i)
        let can_place_here = is_empty || is_intersection
        if(!can_place_here) return false
      }

      // same deal as above, we just search in the row below the word
      for (let r = row + 1, c = col, i = 0; r < grid.length && c < col + word.length; c++, i++) {
        let is_empty = grid[r][c] == null
        let is_intersection = grid[row][c] != null && grid[row][c]['char'] == word.charAt(i)
        let can_place_here = is_empty || is_intersection
        if (!can_place_here) return false
      }

      // check to make sure we aren't overlapping a char (that doesn't match)
      // and get the count of intersections
      intersections = 0
      for (let c = col, i = 0; c < col + word.length; c++, i++) {
        let result = canPlaceCharAt(word.charAt(i), row, c)
        if(result === false) return false
        intersections += result
      }
    } else if (direction == "down") {
      // out of bounds
      if (row + word.length > grid.length) return false
      // can't have a word directly above
      if (row - 1 >= 0 && grid[row - 1][col] != null) return false
      // can't have a word directly below
      if (row + word.length < grid.length && grid[row+word.length][col] != null) return false

      // check the column to the left to make sure there isn't another
      // word running parallel. It is ok if there is a character to the
      // left, only if the character to the right intersects with the
      // current word
      for (let c = col - 1, r = row, i = 0; c >= 0 && r < row + word.length; r++, i++) {
        let is_empty = grid[r][c] == null
        let is_intersection = grid[r][col] != null && grid[r][col]['char'] == word.charAt(i)
        let can_place_here = is_empty || is_intersection
        if (!can_place_here) return false
      }

      // same deal, but look at the column to the right
      for (let c = col + 1, r = row, i = 0; r < row + word.length && c < grid[r].length; r++, i++) {
        let is_empty = grid[r][c] == null
        let is_intersection = grid[r][col] != null && grid[r][col]['char'] == word.charAt(i)
        let can_place_here = is_empty || is_intersection
        if (!can_place_here) return false
      }

      // check to make sure we aren't overlapping a char (that doesn't match)
      // and get the count of intersections
      intersections = 0
      for (let r = row, i = 0; r < row + word.length; r++, i++) {
        let result = canPlaceCharAt(word.charAt(i, 1), r, col)
        if(result === false) return false
        intersections += result
      }
    } else {
        throw "Invalid Direction"
    }
    return intersections
  }

  var randomDirection = function() {
    return Math.floor(Math.random()*2) ? "across" : "down"
  }

  var findPositionForWord = function (word) {
    // check the char_index for every letter, and see if we can put it there in a direction
    var bests = []
    for (var i = 0; i < word.length; i++) {
      var possible_locations_on_grid = char_index[word.charAt(i)]
      if(!possible_locations_on_grid) continue
      for (var j = 0; j < possible_locations_on_grid.length; j++) {
        var point = possible_locations_on_grid[j]
        var r = point['row']
        var c = point['col']
        // the c - i, and r - i here compensate for the offset of character in the word
        var intersections_across = canPlaceWordAt(word, r, c - i, "across")
        var intersections_down = canPlaceWordAt(word, r - i, c, "down")

        if (intersections_across !== false)
          bests.push({"intersections" : intersections_across, "row" : r, "col" : c - i, "direction" : "across"})
        if (intersections_down !== false)
          bests.push({"intersections" : intersections_down, "row" : r - i, "col" : c, "direction" : "down"})
      }
    }

    if(bests.length == 0) return false;

    // find a good random position
    var best = bests[Math.floor(Math.random()*bests.length)]

    return best
  }

  var clear = function () {
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        grid[r][c] = null
      }
    }
    char_index = {}
  }

  // constructor
  if (words_in.length < 2) throw "A crossword must have at least 2 words";
  if (words_in.length != clues_in.length) throw "The number of words must equal the number of clues";	

  // build the grid;
  var grid = new Array(GRID_ROWS)
  for (var i = 0; i < GRID_ROWS; i++) {
    grid[i] = new Array(GRID_COLS)
  }

  // build the element list (need to keep track of indexes in the originial input arrays)
  var word_elements = []
  for (let i = 0; i < words_in.length; i++) {
    word_elements.push(new WordElement(words_in[i], i))
  }

  // I got this sorting idea from http://stackoverflow.com/questions/943113/algorithm-to-generate-a-crossword/1021800#1021800
  // seems to work well
  word_elements.sort(function(a, b){ return b.word.length - a.word.length; })
}

var CrosswordUtils = {
  PATH_TO_PNGS_OF_NUMBERS : "numbers/",

  toHtml : function(grid, show_answers){
    if (grid == null) return
    var html = []
    html.push("<table class='crossword'>")
    var label = 1
    for (var r = 0; r < grid.length; r++) {
      html.push("<tr>");
      for (var c = 0; c < grid[r].length; c++) {
        var cell = grid[r][c]
        var is_start_of_word = false
        var css_class, char
        if (cell == null) {
          char = "&nbsp;"
          css_class = "no-border"
        } else {
          char = cell['char']
          css_class = ""
          is_start_of_word = (cell['across'] && cell['across']['is_start_of_word']) || (cell['down'] && cell['down']['is_start_of_word'])
        }

        if (is_start_of_word) {
          var img_url = CrosswordUtils.PATH_TO_PNGS_OF_NUMBERS + label + ".png"
          html.push("<td class='" + css_class + "' title='" + r + ", " + c + "' style=\"background-image:url('" + img_url + "')\">")
          label++
        } else {
          html.push("<td class='" + css_class + "' title='" + r + ", " + c + "'>")
        }

        if (show_answers) {
          html.push(char)
        } else {
          html.push("&nbsp;")
        }
      }
      html.push("</tr>")
    }
    html.push("</table>")
    return html.join("\n")
  }
}

export default {
  props: {
    wordsWithReflexions: {
      type: Array,
      default: () => [
        {
          'word': 'Coffee',
          'description': 'Many people drink it in the morning with milk or cream.'
        },
        {
          'word': 'Tea',
          'description': "British people drink it at 5 o' clock."
        },
        {
          'word': 'Peach',
          'description': 'Juicy, round fruit with a stone-like seed.'
        },
        {
          'word': 'Grape',
          'description': 'You make wine from this fruit.'
        },
        {
          'word': 'Primero',
          'description': 'Que ocupa el lugar número uno en una serie ordenada. Dicho de una persona o de una cosa: Que precede a las demás de su especie en orden, tiempo, lugar, situación, clase o jerarquía.'
        },
        {
          'word': 'Lemon',
          'description': 'You make lemonade from this fruit.'
        },
        {
          'word': 'Cake',
          'description': 'You serve it at birthday parties.'
        },
        {
          'word': 'Fish',
          'description': 'You can find them in an aquarium.'
        },
        {
          'word': 'Egg',
          'description': 'Hens lay it.'
        },
        {
          'word': 'Pork',
          'description': 'Meat from a pig.'
        },
        {
          'word': 'Apple',
          'description': 'Eve gave one to Adam.'
        },
        {
          'word': 'Chicken',
          'description': 'An animal which lays eggs'
        },
        {
          'word': 'Goat',
          'description': 'Used for milk and cheese'
        },
        {
          'word': 'Horse',
          'description': 'Found in races'
        },
        {
          'word': 'Kitten',
          'description': 'A baby cat'
        },
        {
          'word': 'Snake',
          'description': 'An animal with no feet'
        },
        {
          'word': 'Cat',
          'description': 'A popular house pet'
        },
        {
          'word': 'Cow',
          'description': 'Relative of a bull'
        }
      ]
    },
    lang: {
      type: String,
      default: 'EN',
      validator: function (value) {
        // The value must match one of these strings
        return ['EN', 'ES'].indexOf(value) !== -1
      }
    },
    showPlayAgain: {
      type: Boolean,
      default: true
    }
  },

  data () {
    return {
      selectedWords: [],
      acrossWords: [],
      downWords: [],
      matrix: null,
      grid: null,
      form: null,
      smallContainer: false
    }
  },

  computed: {
    words: function () {
      return this.selectedWords.map(wordWithReflexion => wordWithReflexion.word)
    },

    clues: function () {
      return this.selectedWords.map(wordWithReflexion => wordWithReflexion.description)
    },

    across: function () {
      let acrossWord
      switch (this.lang) {
        case 'ES':
          acrossWord = 'Horizontales'
          break
        // case 'FR':
        //   acrossWord = 'Horizontal'
        //   break
        default:
          acrossWord = 'Across'
          break
      }
      return acrossWord
    },

    down: function () {
      let downWord
      switch (this.lang) {
        case 'ES':
          downWord = 'Verticales'
          break
        // case 'FR':
        //   across = 'Vertical'
        //   break
        default:
          downWord = 'Down'
          break
      }
      return downWord
    }
  },

  methods: {
    index: function (index1, index2) {
      let id = `item${index1+1}-${index2+1}`
      return id
    },

    pattern: function (value) {
      // pattern="^[sS]{1}$"
      let pattern = `^[${value.toLowerCase()}${value.toUpperCase()}]{1}$`
      return pattern
    },

    equalsLetters: function (letter1, letter2) {
      return (letter1.toUpperCase() === letter2.toUpperCase()) || (letter1.toLowerCase() === letter2.toLowerCase())
    },

    setRandomWords: function () {
      let eightWords = []
      while (eightWords.length < 8) {
        let word = this.wordsWithReflexions[Math.floor(Math.random()*this.wordsWithReflexions.length)]
        if (eightWords.indexOf(word) < 0) {
          eightWords.push(word)
        }
      }
      this.selectedWords = eightWords
    },

    generateGrid: function () {
      const MATRIX_LENGTH = 13

      let grid

      while ((!grid) || (grid.length>MATRIX_LENGTH)) {
        // // Create crossword object with the words and clues
        this.setRandomWords()
        var cw = new Crossword(this.words, this.clues)
        // create the crossword grid (try to make it have a 1:1 width to height ratio in 10 tries)
        var tries = 10
        grid = cw.getSquareGrid(tries)
      }

      this.grid = grid

      this.form = [ ...Array(MATRIX_LENGTH) ].map(() => Array(MATRIX_LENGTH).fill(''))
      
      // fill grid in
      if (this.grid.length < MATRIX_LENGTH) {
        // add rows
        while (this.grid.length < MATRIX_LENGTH) {
          this.grid.push([])
        }
        // add columns
        this.grid.forEach(row => {
          while (row.length < MATRIX_LENGTH) {
            row.push(null)
          }
        })

        let legend = cw.getLegend(this.grid)
        this.acrossWords = legend.across
        this.downWords = legend.down
      }
    },

    playAgain: function () {
      this.generateGrid()
    },

    getWindowWidth: function () {
      if (this.$refs['crossword-container'].parentElement.parentElement.clientWidth < 1200) {
        this.smallContainer = true
      }
    }
  },

  mounted () {
    this.generateGrid()
    this.$nextTick(function() {
      window.addEventListener('resize', this.getWindowWidth)
      this.getWindowWidth()
    })
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.getWindowWidth)
  }
}
</script>

<style>
.crossword-board__item--valid {
  background: #9aff67;
}

.hightlighted {
  background: rgba(255, 255, 255, 0.95);
  padding: 3px 5px;
  margin: -3px -5px;
  line-height: 1.7;
  display: inline;
}

.crossword-board-container {
  position: relative;
  /* background: #fff; */
}

.crossword-board {
  position: relative;
  z-index: 1;
  background: transparent;
  border: 1px solid #000;
  width: 650px;
  height: 650px;
  display: grid;
  grid-template: repeat(13, 7.69231%) / repeat(13, 7.69231%);
  list-style-type: none;
  padding: 0;
  margin: 0 auto;
}

.crossword-board__item {
  border: 1px solid #000;
  position: relative;
  z-index: 100;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  text-transform: uppercase;
}

.crossword-board__item:not(.crossword-board__item--valid) {
  background-color: #fff;
}

.crossword-board__item:active:not(.crossword-board__item--valid), .crossword-board__item:focus:not(.crossword-board__item--valid) {
  background: #ffff74;
  border: 1px solid #000;
  outline: 1px solid #000;
}

.crossword-board__item--blank {
  background-color: #75489794;
  border: 1px solid #000;
  outline: 1px solid #000;
}

.crossword-clues {
  /* position: absolute;
  margin-top: 650px; */
  color: #000;
  /* top: 0;
  left: 650px;
  width: 650px; */
}

.crossword-clues__list {
  margin: 0 0 0 60px;
  padding: 0;
  display: inline-block;
  vertical-align: top;
}

.crossword-clues__list-title {
  font-weight: bold;
  padding: 4px;
}

.crossword-clues__list-item {
  margin: 0;
  padding: 4px;
}
</style>
