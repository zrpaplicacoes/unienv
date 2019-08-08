class Stash {
  constructor(id, name) {
    /**
     * stash ref (like "stash@{0}")
     * @type {string}
     * @public
     */
    this.id = id;
    /**
     * stash message
     * @type {string}
     * @public
     */
    this.name = name;
  }
}

module.exports = {
  Stash,
};
