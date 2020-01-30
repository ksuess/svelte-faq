<script>
  import { fade } from 'svelte/transition';

  export let question = "What is the question?"
  export let answer = "The answer is 42."

  let visible = false;

  function toggleAnswer(event) {
    visible = !visible;
  }
</script>


<li transition:fade="{{duration:1000}}">
  <h2 on:click={toggleAnswer}>{question}</h2>
  {#if visible}
    <p transition:fade="{{duration:1000}}">
      {answer}
    </p>
  {/if}
</li>


<style type="less">
  li {
    list-style-type: none;
    h2 {
      text-decoration: underline;
      cursor: pointer;
    }
  }
</style>
