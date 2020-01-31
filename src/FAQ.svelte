<!--
TODO use external data
 -->

<script>
  import FAQItem from './FAQItem.svelte'

  export let faqitems = undefined; // store must be provided by parent
  let question = '';
  let answer = '';

  function createFAQItem(event) {
    // reactivity! updating the store cause the view to update with the new FAQItem
    faqitems.create({question: question, answer: answer});
    question = '';
    answer = '';
  }
</script>


<ul>
  {#each $faqitems as faqitem, i} <!-- $faqitems: value (list of FAQ items) stored in store -->
    <FAQItem faqitem={faqitem}
      index={i}
      faqitems={faqitems}/>
  {/each}
</ul>

<div>
  <label>
    Question:
    <input type="text" bind:value={question}>
  </label>
  <label>
    Answer:
    <input type="text" bind:value={answer}>
  </label>
  <button on:click={createFAQItem}>add</button>
</div>

<style type="less">
ul {
  padding-left: 0;
}
div {
  background-color: lighten(steelblue, 45%);
  padding: 0.7rem 0.4rem;
}
</style>
