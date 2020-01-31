<script>
  import FAQ from "./FAQ.svelte"
  import {faqitemsstore1} from './stores.js'
  import {faqitemsstore2} from './stores.js'

  export let name;
</script>


<main>
  <div>
    <h2>DEBUG</h2>
    <button on:click={() => {console.log(faqitemsstore1);console.log($faqitemsstore1)}}>show store faqitemsstore1</button>
  </div>

  <h1>FAQ for "{name}"</h1>
  <FAQ faqitems={faqitemsstore1}/>

  <h1>FAQ for "Frameworks"</h1>
  <FAQ faqitems={faqitemsstore2}/>
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

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
