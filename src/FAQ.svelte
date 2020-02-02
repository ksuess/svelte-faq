<script>
  import {onMount} from 'svelte';
  import {createFAQItems} from './stores.js'
  import FAQItem from './FAQItem.svelte'
  import { text_area_resize } from './autoresize_textarea.js'

  export let apiURL = undefined;
  let faqitems = undefined; // store: variable, not const, because we create / initialize it onMount

  let question = '';
  let answer = '';

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

  function createFAQItem(event) {
    // reactivity! updating the store cause the view to update with the new FAQItem
    faqitems.create({question: question, answer: answer});
    question = '';
    answer = '';
  }

  let promise = getFAQItems();
  async function getFAQItems() {
    const response = await fetch(apiURL);
    const data = await response.json();
    // creating store
    faqitems = await createFAQItems(data);
    if (response.ok) {
      return faqitems;
    } else {
      throw new Error(data);
    }
  };

  onMount(() => {
    promise = getFAQItems();
  })
</script>


<div class="debug">
  <h2>DEBUG</h2>
  <ul>
    <li>
      <button on:click={() => {
        console.log(faqitems);
        console.log($faqitems)
      }}>log store of FAQs</button>
    </li>
  </ul>
</div>


{#await promise}
  <p>...waiting</p>
{:then}
  <ul>
    {#each $faqitems as faqitem, i} <!-- $faqitems: value (list of FAQ items) stored in store faqitems -->
      <FAQItem faqitem={faqitem}
        index={i}
        faqitems={faqitems}/>
    {/each}
  </ul>
{:catch error}
  <p style="color: red">{error.message} url: {apiURL}</p>

  <h3>Default Content on network error:</h3>
  <ul style="color: orange">
    {#each faqitems_plone as faqitem, i} <!-- $faqitems: value (list of FAQ items) stored in store faqitems -->
      <FAQItem faqitem={faqitem}
        index={i}
        faqitems={faqitems}/>
    {/each}
  </ul>
{/await}

<div class="createFAQItem">
  <label>
    Question:
    <input type="text" bind:value={question}/>
  </label>
  <label>
    Answer:
    <textarea bind:value={answer} use:text_area_resize/>
  </label>
  <button on:click={createFAQItem}>add</button>
</div>

<style type="less">
ul {
  padding-left: 0;
}
div.createFAQItem {
  background-color: lighten(steelblue, 45%);
  padding: 0.7rem 0.4rem;
}
</style>
