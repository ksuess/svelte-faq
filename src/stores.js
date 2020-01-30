import {writable} from 'svelte/store'

const faqitems_default = [
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
        question: 'Who can join the Plone Foundation',
        answer: `Everyone contributing to Plone Software, Plone documentation, organizing events or doing something good for PF.`
    }
]

function createFAQItems() {
    const {subscribe, set, update} = writable(faqitems_default);

    return {
        subscribe,
        create: (question, answer) => update(items => items.push({question: question, answer: answer})),
        reset: () => set(faqitems_default)
    }
}

export const faqitemsstore1 = createFAQItems();
export const faqitemsstore2 = createFAQItems();
