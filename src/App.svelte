<script>
  import FAQ from "./FAQ.svelte"

  // export let name;

  let url1 = 'https://raw.githubusercontent.com/ksuess/svelte-faq/master/faqitems_garten.json';
  let url2 = 'https://raw.githubusercontent.com/ksuess/svelte-faq/master/faqitems_plone.json';
</script>


<main>
  <div class="debug">
    <h2>DEBUG</h2>
    <ul>
      <li>
        <button on:click={() => {
            console.log("piep");
          }}>show</button>
      </li>
    </ul>
  </div>

  <h1>FAQ for "Garten"</h1>
  <FAQ apiURL={url1}/>

  <h1>FAQ for "Plone"</h1>
  <FAQ apiURL={url2}/>
</main>


<style type="less">
  main {
    /* text-align: center; */
    padding: 1em;
    max-width: 1000px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  /* @media (min-width: 640px) {
    main {
      max-width: none;
    }
  } */
</style>
