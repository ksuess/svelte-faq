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
        question: 'Who can join the Plone Foundation?',
        answer: `Everyone contributing to Plone Software, Plone documentation, organizing events or doing something good for PF.`
    },
    {
        question: 'When is the next conference?',
        answer: `November in Belgium`
    }
]

const faqitems_frameworks = [
    {
        question: 'Why do I need a framework?',
        answer: 'It saves time. You can skip to important tasks.'
    }
]



// store with args for initial data
// with args it's possible to use function for multiple independent stores of same type for same component which is consumed more than once
function createFAQItems(items) {
    const {subscribe, set, update} = writable(items);

    return {
        subscribe,
        set,
        create: faqitem => update(items => {
            // console.log('create faqitem', faqitem);
            return [
                ...items,
                faqitem
            ]
        }),
        delete: index => update(items => {
            // console.log(`FAQItem with ${index} deleted`);
            // console.log("Items before deleting action", items);
            items.splice(index, 1);
            return items
        }),
        reset: () => set(items)
    }
}

export const faqitemsstore1 = createFAQItems(faqitems_default);
export const faqitemsstore2 = createFAQItems(faqitems_frameworks);
