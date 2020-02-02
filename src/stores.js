import {writable} from 'svelte/store'

// store with args for initial data
// with args it's possible to use function for multiple independent stores of same type for same component which is consumed more than once
export function createFAQItems(items) {
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
