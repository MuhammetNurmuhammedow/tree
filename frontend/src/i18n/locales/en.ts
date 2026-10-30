const en = {
  translation: {
    // App Header
    app: {
      title: 'Family Tree',
      subtitle: 'Genealogy Registry',
    },
    // Language selector
    language: {
      label: 'Language',
      tk: 'Turkmen',
      en: 'English',
      ru: 'Russian',
    },
    // Tree selector / header
    tree: {
      select: 'Select a tree',
      newTree: 'New Family Tree',
      myTree: 'My Tree',
      loading: 'Loading…',
      empty: 'No trees found',
      owner: 'Owner',
      readOnly: 'View only',
      editable: 'My Tree (Editable)',
      members: 'members',
      backToMyTree: 'Switch to My Tree',
    },
    // Search
    search: {
      placeholder: 'Search person… (name, surname)',
      noResults: 'No results found',
      searching: 'Searching…',
      foundCount: 'Found Persons',
    },
    // Toolbar buttons
    toolbar: {
      addPerson: 'Add Person',
      addRelation: 'Add Bond',
      resetLayout: 'Auto Layout',
      theme: 'Theme',
      export: 'Export',
      exportPng: 'Download as PNG',
      exportPdf: 'Download as PDF',
      exporting: 'Exporting…',
      sampleData: 'Sample Data',
    },
    // Canvas themes
    themes: {
      slate: 'Dark Slate',
      blueprint: 'Blueprint',
      parchment: 'Ancient Parchment',
      obsidian: 'Deep Obsidian',
    },
    // Canvas hints
    canvas: {
      dragHint: 'Drag nodes anywhere; positions are saved permanently.',
      loading: 'Loading family tree and calculating layout…',
      empty: 'This tree is empty',
      emptyHint: 'Click "Add Person" to add your first family member.',
      error: 'An error occurred while loading the family tree',
    },
    // Person Node
    node: {
      born: 'b.',
      died: 'd.',
      living: 'Living',
      deceased: 'Deceased',
      addParent: 'Add Parent',
      addSpouse: 'Add Spouse',
      addChild: 'Add Child',
      viewProfile: 'View Profile',
    },
    // Person Modal (add person)
    personModal: {
      title: 'Add New Family Member',
      subtitle: 'Register a new member to your family tree',
      firstName: 'First Name',
      lastName: 'Last Name',
      maidenName: 'Maiden Name (Optional)',
      gender: 'Gender',
      genderMale: 'Male',
      genderFemale: 'Female',
      genderOther: 'Other',
      genderUnknown: 'Unknown',
      birthDate: 'Date of Birth',
      birthPlace: 'Place of Birth',
      isLiving: 'This family member is living',
      deathDate: 'Date of Death',
      deathPlace: 'Place of Death',
      biography: 'Biography / Memories',
      biographyPlaceholder: 'Memories, occupation or important life details about this person…',
      cancel: 'Cancel',
      submit: 'Add to Family',
      submitting: 'Saving…',
      errorRequired: 'First Name and Last Name are required',
      errorGeneral: 'An error occurred while adding the person',
      placeholderFirst: 'e.g. John',
      placeholderLast: 'e.g. Smith',
      placeholderMaiden: 'Previous surname if any',
      placeholderBirthPlace: 'City or Country',
      placeholderDeathPlace: 'City of death',
      placeholderBio: 'Memories, occupation or important life details…',
    },
    // Relationship Modal & Kinship
    relationModal: {
      title: 'Create Family Bond',
      subtitle: 'Set parent, spouse or child relationship between two family members',
      bondCategory: 'Bond Category',
      bondType: 'Kinship / Relationship Type',
      customTitleLabel: 'Displayed Kinship Title (Customizable)',
      customTitlePlaceholder: 'e.g. Husband, Wife, Partner, Mother-in-law, Fiancé…',
      
      // Marriage
      spouseGeneral: 'Spouse / Partner (Marriage)',
      spouseHusband: 'Husband',
      spouseWife: 'Wife',
      formerSpouse: 'Former Spouse (Divorced)',
      fiance: 'Fiancé / Fiancée',
      
      // In-laws
      inLawFather: 'Father-in-law',
      inLawMother: 'Mother-in-law',
      inLawSon: 'Son-in-law',
      inLawDaughter: 'Daughter-in-law',
      inLawBrother: 'Brother-in-law',
      inLawSister: 'Sister-in-law',

      // Direct
      parentFather: 'Father',
      parentMother: 'Mother',
      parentGeneral: 'Parent',
      childSon: 'Son',
      childDaughter: 'Daughter',
      childGeneral: 'Child',
      adoptiveParent: 'Adoptive / Foster Parent',
      adoptiveChild: 'Adoptive / Foster Child',
      customOption: 'Custom Relationship Title (Type your own)',

      targetPerson: 'Family Member to Link',
      noPersons: 'No other members found in this tree. Add a new person first.',
      marriageDate: 'Marriage Date (Optional)',
      cancel: 'Cancel',
      submit: 'Complete Bond',
      submitting: 'Saving…',
      errorSelect: 'Please select a family member',
      errorGeneral: 'An error occurred while adding the relationship',
      personLabel: '{{name}} ({{gender}}) {{birth}}',
      male: 'Male',
      female: 'Female',
    },
    // Create Tree Modal
    createTreeModal: {
      title: 'Create New Family Tree',
      subtitle: 'Start an independent genealogy registry for your family',
      treeName: 'Tree Name',
      description: 'Description (Optional)',
      placeholderName: 'e.g. Smith Family Tree',
      placeholderDesc: 'e.g. Paternal lineage from Manchester…',
      cancel: 'Cancel',
      submit: 'Start Tree',
      submitting: 'Creating…',
      errorRequired: 'Tree name is required',
      errorGeneral: 'Could not create tree',
    },
    // Person Detail Modal (profile)
    detailModal: {
      born: 'Born',
      died: 'Died',
      biography: 'Biography',
      noBiography: 'No biography entered.',
      close: 'Close',
      edit: 'Edit',
      addRelative: 'Add Relative',
      addParent: 'Add Parent',
      addSpouse: 'Add Spouse',
      addChild: 'Add Child',
    },
    // Toast messages
    toast: {
      pngSuccess: 'Family tree downloaded as PNG',
      pdfSuccess: 'Family tree downloaded as PDF',
      pngError: 'An error occurred while creating PNG',
      pdfError: 'An error occurred while creating PDF',
      treeLoaded: 'Tree loaded',
    },
  },
} as const;

export default en;
