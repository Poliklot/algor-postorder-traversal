class Trie {
    constructor (nodeList) {
        this.trie = {};
        this.nodeList = nodeList;
        this.build();
    }

    build () {
        this.nodeList.forEach(node => {
            this.virtualTrie = this.trie;
            node.split('').forEach(letter => {
                if (!this.virtualTrie[letter]) this.virtualTrie[letter] = {};
                this.virtualTrie = this.virtualTrie[letter];
            }) 
        });
    }

    hasNode (node) {
        this.virtualTrie = this.trie;
        for (const letter of node.split('')) {
            if (!this.virtualTrie[letter]) return false;
            this.virtualTrie = this.virtualTrie[letter];
        }
        return true;
    }
}
