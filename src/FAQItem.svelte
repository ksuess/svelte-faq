<script>
  import { fade } from 'svelte/transition';
  import { slide } from 'svelte/transition';

  export let faqitem = undefined;
  export let index = undefined;
  export let faqitems = undefined; // store must be provided by parent

  let answervisible = false;
  let editmode = false;

  function toggleAnswer(event) {
    answervisible = !answervisible;
  }

  function saveFAQItem(event) {
    // console.log("faqitem to save", faqitem);
    // why isn't it necessary to update the store explicitly with the new faqitem?
    // if it's really not necessary, the index is superfluous (no, see delete and add new item)
    // $faqitems[index] = faqitem;
    editmode = false;
    answervisible = true;
    // console.log("faqitem saved to ", $faqitems);
    // console.log("index", index);
  }

  function deleteFAQItem(event) {
    faqitems.delete(index);
  }
</script>


<li>
  <div class="control">
    <button class="destructive"
      on:click={deleteFAQItem}>delete</button>
    <button on:click={() => editmode=!editmode}>edit</button>
  </div>
  {#if !editmode}
    <h2 on:click={toggleAnswer}>{faqitem.question}</h2>
    <!-- conditional CSS class -->
    <h3 class:hidden={!answervisible}>hope we can help with following answer. Mail us, we like to improve the help section. (TOTAKE: <i>conditional class</i>)</h3>
    {#if answervisible}
      <p transition:slide|local="{{duration:1000}}">
        {faqitem.answer}
      </p>
    {/if}
  {:else}
    <div transition:fade>
      <label>
        Question:
        <input type="text" bind:value={faqitem.question}>
      </label>
      <label>
        Answer:
        <input type="text" bind:value={faqitem.answer}>
      </label>
      <button on:click={saveFAQItem}>save (in fact no need to save, store is updated while typing)</button>
    </div>
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


  .hidden {
    display: none;
  }
</style>
