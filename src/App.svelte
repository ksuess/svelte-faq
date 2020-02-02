<script>
  import FAQ from "./FAQ.svelte"
  // import {faqitemsstore1} from './stores.js'
  // import {faqitemsstore2} from './stores.js'
  import {createFAQItems} from './stores.js'

  export let name;


  // stores for multiple FAQs
  const faqitems_plone = [
      {
          question: 'What does the Plone Foundation do?',
          answer: `The mission of the Plone Foundation is to protect and promote Plone.
              The Foundation provides marketing assistance, awareness, and
              evangelism assistance to the Plone community. The Foundation also
              assists with development funding and coordination of funding for
              large feature implementations. In this way, our role is similar to
              the role of the Apache Software Foundation and its relationship with
              the Apache Project.`
      },
      {
          question: 'Who can join the Plone Foundation?',
          answer: `Everyone contributing to Plone Software, Plone documentation, organizing events or doing something good for PF.`
      },
      {
          question: 'When is the next conference?',
          answer: `November in Belgium`
      }
  ]

  const faqitems_frameworks = [
      {
          question: 'Why do I need a framework?',
          answer: 'It saves time. You can skip to important tasks.'
      }
  ]
  const faqstore1 = createFAQItems(faqitems_plone);
  const faqstore2 = createFAQItems(faqitems_frameworks);
</script>


<main>
  <div class="debug">
    <h2>DEBUG</h2>
    <ul>
      <li>
        <button on:click={() => {
          console.log(faqstore1);
          console.log($faqstore1)
        }}>FAQ "{name}": log store of FAQs 1</button>
      </li>
      <li>
        <button on:click={() => {
          console.log(faqstore2);
          console.log($faqstore2)
        }}>FAQ "Frameworks" log store of FAQs 2</button>
      </li>
      <!-- <li>
        <button on:click={() => {
            console.log("piep")
          }}>show</button>
      </li> -->
    </ul>

  </div>

  <h1>FAQ for "{name}"</h1>
  <FAQ faqitems={faqstore1}/>

  <h1>FAQ for "Frameworks"</h1>
  <FAQ faqitems={faqstore2}/>
</main>


<style type="less">
  main {
    /* text-align: center; */
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  .debug {
    /* display: none; */
    background-color: lighten(seagreen, 45%);
    padding: 1rem;
    li {
      list-style-type: none;
    }
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
