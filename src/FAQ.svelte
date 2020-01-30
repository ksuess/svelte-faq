<!--
TODO add FAQItem
TODO use external data
 -->

<script>
  import FAQItem from './FAQItem.svelte'

  export let faqitems = []
</script>


<ul>
  {#each faqitems as faqitem}
    <FAQItem question={faqitem.question} answer={faqitem.answer} />
  {/each}
</ul>
