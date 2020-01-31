<script>
  import { fade } from 'svelte/transition';

  export let faqitem = undefined;
  export let index = undefined;
  export let faqitems = undefined; // store must be provided by parent

  let answervisible = false;
  let editmode = false;

  function toggleAnswer(event) {
    answervisible = !answervisible;
  }

  function saveFAQItem(event) {
    // TODO save handler
    // why isn't it necessary to update the store explicitly with the new faqitem?
    // if it's really not necessary, the index is superfluous
    console.log(faqitem);
    // $faqitems[index] = this;
    console.log("faqitem saved to ", $faqitems);
    console.log("index", index);
    editmode = false;
    answervisible = true;
  }
</script>


<li transition:fade="{{duration:1000}}">
  <div class="control">
    <button class="destructive">delete</button>
    <button on:click={() => editmode=!editmode}>edit</button>
  </div>
  {#if !editmode}
    <h2 on:click={toggleAnswer}>{faqitem.question}</h2>
    {#if answervisible}
      <p transition:fade="{{duration:1000}}">
        {faqitem.answer}
      </p>
    {/if}
  {:else}
    <label>
      Question:
      <input type="text" bind:value={faqitem.question}>
    </label>
    <label>
      Answer:
      <input type="text" bind:value={faqitem.answer}>
    </label>
    <button on:click={saveFAQItem}>save</button>
  {/if}
</li>


<style type="less">
  li {
    list-style-type: none;
    position: relative;
    h2 {
      text-decoration: underline;
      cursor: pointer;
    }
  }
  .control {
    display: flex;
    flex-direction: row;
    /* justify-content: flex-end; */
    position: absolute;
    right: 0;
    button {
      margin-right: .3rem;
    }
  }
</style>
