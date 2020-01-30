<script>
  import { fade } from 'svelte/transition';

  export let question = "What is the question?"
  export let answer = "The answer is 42."
</script>


<li transition:fade="{{duration:2000}}">
  <h2>{question}</h2>
  <p>
    {answer}
  </p>
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
