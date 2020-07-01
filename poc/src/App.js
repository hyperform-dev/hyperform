
import './App.css';
import React, { useState } from 'react'
import aws from 'aws-sdk'
import { motion, AnimatePresence } from "framer-motion"


const lambda = new aws.Lambda({
  region: 'us-east-2'
})

const REGEX = /endpoint_[\w]+/g



function App() {

  //const [text, setText] = useState("")
  /** [ { linenum: number, status: DEPLOYING | DEPLOYED, arn?: string}] */
  // const deployments = useState([])
  const [pills, setPills] = useState([])

  const onType = (event) => {
    const txt = event.target.value || ""

    let matches = txt.match(REGEX) || []
    // TODO show warning on dupe
    // remove duplicate matches (lol)
    matches = [...new Set(matches)]
    setPills(matches)
  }

  const Pill = ({ text, visible }) => (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            delay: 1.8
          }}
        >

          <div className="pill" key={text}>
            <div className="pill-top">
              {text}
            </div>
            <div className="pill-bottom">
              arn:aws:lambda:us-east-2:735406098573:function:{text}
            </div>

          </div>

        </motion.div>
      )}
    </AnimatePresence>
  )

  
  const str = `function increase({ number }) {
  return {
    number: number + 1
  }
}

module.exports = {
  increase
}
`


  return (
    <header className="App">
      <div className="bar">
        { pills.map(p => <Pill visible={true} text={p} /> )}
      </div>
      <div className="board">

        <textarea
          className="textfield"
          autoCapitalize="none"
          autoCorrect="none"
          spellCheck={false}
          autoFocus
          onChange={onType}
        >
          { str }
        </textarea>
      </div>


    </header>
  );
}

export default App;
