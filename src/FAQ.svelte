<!--
TODO add FAQItem
TODO use external data
 -->

<script>
  import FAQItem from './FAQItem.svelte'

  export let faqitems = []; // must be provided by parent
  let question = 'What is your question?';
  let answer = `It's that easy: 42.`;

  function createFAQItem(event) {
    faqitems.create({question: 'abc?', answer: 'lkajöd lakjdf'});
  }
</script>


<ul>
  {#each $faqitems as faqitem} <!-- $faqitems: value (list of FAQ items) stored in store -->
    <FAQItem question={faqitem.question} answer={faqitem.answer} />
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
  <!-- <button on:click={createFAQItem}>add</button> -->
  <button on:click={
      () => faqitems.create('qs', 'about 42')
    }>add static FAQItem</button>
  <button on:click={createFAQItem}>add</button>
</div>
