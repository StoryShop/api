/**
 * Falcor Data Model
 */
type FalcorModel = {
  currentUser: $ref( usersById ),

  /**
   * FIXME(joshdmiller): move to usersById
   */
  currentUserVoiceToken: String,

  /**
   * Users: accounts or potential accounts with the platform.
   */
  usersById: {
    [String]: {
      // User entity fields are currently inaccessible due to lack of need.

      /**
       * @immutable
       */
      _id: String,

      email: String,

      /**
       * The worlds to which this user has access.
       */
      worlds: {
        /**
         * @immutable
         */
        length: Number,

        [Integer]: $ref( worldsById ),

        // FIXME(joshdmiller): Likely belongs elsewhere.
        // Create a new world with this user as the owner.
        push: $call( title ),
      },

      /**
       * The file uploads to which this user has access.
       */
      files: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: {
          name: String,
          url: String,
          contentType: String,
          size: Number,
          extension: String,
        },
      },

      /**
       * User preferences related to app behaviour.
       */
      ux: {
        // FIXME(jdm): Currently unused due to redirect issues.
        lastVisited: String,
      },
    },
  },

  /**
   * Worlds: containers in which to house information such as characters and settings for use in
   * zero or more books.
   */
  worldsById: {
    [String]: {
      /**
       * @immutable
       */
      _id: String,

      title: String,
      slug: String,

      // The colour used for the world throughout the app.
      // FIXME(joshdmiller): deprecated
      colour: String,

      // User-created "tags" used to organize/categorize elements.
      labels: $atom( Array<String> ),

      /**
       * @immutable
       *
       * The current user's access control rights for this world, if any.
       *   - A: owner/administator permissions
       *   - W: write permissions
       *   - R: read-only permissions
       */
      rights: $atom( Array<Enum( A, R, W )> ),

      // FIXME(joshdmiller): deprecated in favour of "books"
      outlines: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $ref( outlinesById ),

        // Create a new outline within this world.
        push: $call( title ),

        // Delete an outline from this world. Irreversible.
        delete: $call( id ),
      },

      /**
       * The characters of this world.
       */
      characters: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $ref( charactersById ),

        // Create a new character within this world.
        push: $call( name ),

        // Delete a character from this world. Irreversible.
        delete: $call( id ),
      },

      /**
       * Data about the world: settings, objects, events, etc.
       */
      elements: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $ref( elementsById ),

        // Create a new element within this world.
        push: $call( name ),

        // Delete an element from this world. Irreversible.
        delete: $call( id ),
      },

      /**
       * Narratives that take place within this world.
       * TODO(joshdmiller): not-yet-implemented
       */
      books: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $ref( booksById ),

        // Create a new book within this world.
        push: $call( name ),

        // Delete a book from this world. Irreversible.
        delete: $call( id ),
      },
    },
  },

  /**
   * FIXME(joshdmiller): deprecated.
   */
  outlinesById: {
    [String]: {
      /**
       * @immutable
       */
      _id: String,

      title: String,
      content: atom( DraftObject ),

      // The OPML output of the content block
      opml: String,
    },
  },

  /**
   * Elements: data about the world, such as settings, objects, events, etc.
   */
  elementsById: {
    [String]: {
      /**
       * @immutable
       */
      _id: String,

      /**
       * @immutable
       */
      world: $ref( worldsById ),

      title: String,
      content: $atom( DraftObject ),
      tags: $atom( Array<String> ),

      /**
       * @immutable
       */
      cover: $ref( usersById -> files -> Number ),

      cover: $call( usersById -> files -> Number ),

      // Files attached to this element.
      files: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $ref( usersById -> files -> Number ),

        // Add an existing file as a new attachment to this element, independent of the upload.
        push: $call( fileRefPath ),

        // Remove an attachment from this element, independent of deleting the upload.
        delete: $call( idx ),
      },
    },
  },

  /**
   * TODO(joshdmiller): not currently used; documentation pending
   */
  elementsByNamepart: {
    [String]: {
    },
  },

  /**
   * Characters
   */
  charactersById: {
    [String]: {
      /**
       * @immutable
       */
      _id: String,

      /**
       * @immutable
       */
      world: $ref( worldsById ),

      name: String,

      // A description, bio, and/or background of this character.
      content: $atom( DraftObject ),

      // Alternative names and AKAs for this character.
      aliases: $atom( Array<String> ),

      /**
       * @immutable
       *
       * A thumbnail / chathead / avatar of the character.
       */
      avatar: $ref( usersById -> files -> Number ),

      avatar: $call( usersById -> files -> Number ),

      /**
       * @immutable
       *
       * A wide image to sit atop profile pages.
       */
      cover: $ref( usersById -> files -> Number ),

      cover: $call( usersById -> files -> Number ),

      attributes: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $atom( AttributeObject ),
        push: $call( AttributeObject ),
      },

      relationships: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $atom( RelationshipObject ),
        push: $call( otherCharacterId : String, description : String ),
      },

      genes: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $atom( GeneAlleleObject ),
        push: $call( GeneAlleleObject ),
      },
    },
  },

  /**
   * TODO(joshdmiller): not currently used; documentation pending
   */
  charactersByNamepart: {
    [String]: {
    },
  },

  /**
   * Questions about a character.
   */
  genes: {
    /**
     * Grab a random question from the stack. Expires in 1000ms.
     */
    random: $atom( GeneTemplateObject ),
  },

  /**
   * Books: narratives within a world.
   * TODO(joshdmiller): not-yet-implemented
   */
  booksById: {
    [String]: {
      /**
       * @immutable
       */
      _id: String,

      /**
       * @immutable
       */
      world: $ref( worldsById ),

      title: String,

      /**
       * The current status of the world. The affects only UX.
       *   - O: Outline
       *   - W: Write
       *   - P: Publish
       *   - A: Analytics
       */
      status: Enum( 'O', 'W', 'P', 'A' ),

      /**
       * A book is composed of a series of outline nodes, each of which can optionally have its own
       * nested outline nodes and book parts. This is, essentially, the root level of the outline.
       */
      outlineNodes: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $ref( outlineNodesById ),
      },
    },
  },

  /**
   * Outline Nodes:
   */
  outlinesById: {
    [String]: {
      /**
       * @immutable
       */
      _id: String,

      content: $atom( DraftObject ),

      /**
       * An outline node may optionall be associated with a part of a book to write (e.g. a chapter
       * or section).
       */
      bookPart: $ref( bookpartsById ),

      /**
       * @immutable
       *
       * An indication whether this node or any of its children have a bookpart. Used to filter out
       * pure outline nodes in writing and publish statuses.
       */
      hasBookparts: Boolean,

      /**
       * Child outline nodes.
       */
      children: {
        /**
         * @immutable
         */
        length: Number,

        [Number]: $ref( outlineNodesById ),
      },
    },
  },

  /**
   * Book Parts:
   */
  bookpartsById: {
    [String]: {
      /**
       * @immutable
       */
      _id: String,

      title: String,
      content: $atom( TBD ),
    },
  },
};

/**
 * A representation of a potential block of character DNA, less the answer (allele).
 */
type GeneTemplateObject = {
  _id: String,
  gene: String,
  category: String,
};

/**
 * A representation of a block of character DNA.
 */
type GeneAlleleObject = {
  _id: String, // Only present if based on gene template
  category: String, // Only present if based on a gene template
  gene: String,
  allele: String,
};

/**
 * A representation of an attribute, which is a user-defined key-value pair.
 */
type AttributeObject = [
  key: String,
  value: String,
];

/**
 * A representation of a block of character's relationship to another.
 */
type RelationshipObject = {
  _id: String,
  name: String,
  avatar: $ref( usersById -> files -> Number ),
  description: String,
};

/**
 * A representation of a block of editable text.
 * TODO(joshdmiller): Flesh out
 */
type DraftObject = {
};

