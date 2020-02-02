<script>
  import { fade } from 'svelte/transition';
  import { slide } from 'svelte/transition';
  import { text_area_resize } from './autoresize_textarea.js'

  export let faqitem = undefined;
  export let index = undefined;
  export let faqitems = undefined; // store must be provided by parent

  let answervisible = false;
  let editmode = false;

  function toggleAnswer(event) {
    answervisible = !answervisible;
  }

  function saveFAQItem(event) {
    // in fact no need to save, store is updated while typing.
    // why isn't it necessary to update the store explicitly with the new faqitem?
    // if it's really not necessary, the index is superfluous (no, see delete and add new item)
    // $faqitems[index] = faqitem; // not necessary, store is updated while typing!
    editmode = false;
    answervisible = true;
  }

  function deleteFAQItem(event) {
    faqitems.delete(index);
  }

  // use:action directive example
  function foo(node, editmode) {
    // the node has been mounted in the DOM

    return {
      update(editmode) {
        // the value of `editmode` prop has changed
        console.log(`do something on update (of editmode) of faqitem ${faqitem.question}`);
      },

      destroy() {
        // the node has been removed from the DOM
        // FAQItem is unmounted. So no more access to faqitem prop!
        // Unfortunatly this does not return undefined but prop of another FAQItem instance.
        console.log(node, `faqitem ${faqitem.question} has been removed.`);
      }
    };
  }
</script>


<li use:foo={editmode}>
  {#if !editmode}
    <div class="display">
      <h2 on:click={toggleAnswer}>{faqitem.question}</h2>
      <!-- conditional CSS class -->
      <!-- <h3 class:hidden={!answervisible}>hope we can help with following answer. Mail us, we like to improve the help section. (TOTAKE: <i>conditional class</i>)</h3> -->
      {#if answervisible}
        <p transition:slide|local="{{duration:1000}}">
          {faqitem.answer}
        </p>
      {/if}
    </div>
  {:else} <!-- editmode -->
    <div class="edit" transition:fade>
      <label>
        Question:
        <input type="text" bind:value={faqitem.question}/>
      </label>
      <label>
        Answer:
        <textarea bind:value={faqitem.answer} use:text_area_resize/>
      </label>
      <button on:click={saveFAQItem}>save</button>
    </div>
  {/if}
  <div class="control">
    <button class="destructive"
      on:click={deleteFAQItem}>delete</button>
    <button on:click={() => editmode=!editmode}>edit</button>
  </div>
</li>


<style type="less">
  li {
    list-style-type: none;
    display: flex;
    h2 {
      text-decoration: underline;
      cursor: pointer;
    }
  }
  .control {
    align-self: flex-end;
    margin-left: 1em;
    // control itself
    display: flex;
    flex-direction: row;
    /* justify-content: flex-end; */
    button {
      margin-right: .3rem;
    }
  }


  .hidden {
    display: none;
  }
</style>
