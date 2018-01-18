/*!
 * This module defines the ListDictionary class, a data structure
 * that combines a linked list and a dictionary.
 *
 * Author: Jan Curn (jan@apifier.com)
 * Copyright(c) 2015 Apifier. All rights reserved.
 *
 */

import LinkedList from './linked_list';

/**
 * The main ListDictionary class.
 */
export default class ListDictionary {
    constructor() {
        this.linkedList = new LinkedList();
        this.dictionary = {};
    }

    /**
     * Gets the number of item in the list.
     */
    length() {
        return this.linkedList.length;
    }

    /**
     * Adds an item to the list. If there is already an item with same key, the function
     * returns false and doesn't make any changes. Otherwise, it returns true.
     */
    add(key, item, toFirstPosition) {
        if (typeof (key) !== 'string') throw new Error('Parameter "key" must be a string.');
        if (key in this.dictionary) return false;

        const linkedListNode = this.linkedList.add(item, toFirstPosition);
        linkedListNode.dictKey = key;
        this.dictionary[key] = linkedListNode;

        return true;
    }

    /**
     * Gets the first page request from the queue. The function
     * returns the Request object or null if the queue is empty.
     */
    getFirst() {
        const head = this.linkedList.head;
        if (head) { return head.data; }

        return null;
    }

    /**
     * Gets the first page request from the queue and moves it to the end of the queue.
     * The function returns the Request object or null if the queue is empty.
     */
    moveFirstToEnd() {
        const node = this.linkedList.head;

        if (!node) return null;

        this.linkedList.removeNode(node);
        this.linkedList.addNode(node);

        return node.data;
    }

    /**
     * Removes the first item from the list. The function
     * returns the item object or null if the list is empty.
     */
    removeFirst() {
        const head = this.linkedList.head;

        if (!head) return null;

        this.linkedList.removeNode(head);
        delete this.dictionary[head.dictKey];

        return head.data;
    }

    /**
     * Removes an item identified by a key. The function returns the
     * object if it was found or null if it wasn't.
     */
    remove(key) {
        if (typeof (key) !== 'string') throw new Error('Parameter "key" must be a string.');

        const node = this.dictionary[key];

        if (!node) return null;

        delete this.dictionary[key];
        this.linkedList.removeNode(node);

        return node.data;
    }

    /**
     * Finds a request based on the URL.
     */
    get(key) {
        if (typeof (key) !== 'string') throw new Error('Parameter "key" must be a string.');
        const node = this.dictionary[key];

        if (!node) return null;

        return node.data;
    }

    /**
     * Removes all items from the list.
     */
    clear() {
        if (this.linkedList.length > 0) {
            this.linkedList = new LinkedList();
            this.dictionary = {};
        }
    }
}