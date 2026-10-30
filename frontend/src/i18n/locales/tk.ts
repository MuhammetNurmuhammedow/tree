const tk = {
  translation: {
    // App Header
    app: {
      title: 'Nesil Agajy',
      subtitle: 'Şejere Kütügi',
    },
    // Language selector
    language: {
      label: 'Dil',
      tk: 'Türkmen dili',
      en: 'Iňlis dili',
      ru: 'Rus dili',
    },
    // Tree selector / header
    tree: {
      select: 'Agajy saýlaň',
      newTree: 'Täze Nesil Agajy',
      myTree: 'Meniň Agajym',
      loading: 'Ýüklenýär…',
      empty: 'Agaç tapylmady',
      owner: 'Eýesi',
      readOnly: 'Diňe görmek üçin',
      editable: 'Meniň Agajym (Üýtgedip bolýar)',
      members: 'agza',
      backToMyTree: 'Meniň Agajyma Geç',
    },
    // Search
    search: {
      placeholder: 'Ähli agaçlarda garyndaş ýa-da şahs gözläň…',
      noResults: 'Netije tapylmady',
      searching: 'Gözlenýär…',
      foundCount: 'Tapylan Şahslar',
    },
    // Toolbar buttons
    toolbar: {
      addPerson: 'Şahs Goşmak',
      addRelation: 'Bag Goşmak',
      resetLayout: 'Awtomatiki Düzmek',
      theme: 'Tema',
      export: 'Daşyna Çykarmak',
      exportPng: 'PNG hökmünde ýükle',
      exportPdf: 'PDF hökmünde ýükle',
      exporting: 'Çykarylýar…',
      sampleData: 'Nusga Maglumat',
    },
    // Canvas themes
    themes: {
      slate: 'Gara Daş',
      blueprint: 'Mawy Çyzgy',
      parchment: 'Gadymy Golýazma',
      obsidian: 'Çuň Obsidiyan',
    },
    // Canvas hints
    canvas: {
      dragHint: 'Düwünleri süýräp islän ýeriňize goýup bilersiňiz; ýerleşişi hemişelik saklanýar.',
      loading: 'Nesil agajy we nesiller tertibi hasaplanýar…',
      empty: 'Bu agaç entek boş',
      emptyHint: 'Ilkinji maşgala agzasyny goşmak üçin "Şahs Goşmak" düwmesine basyň.',
      error: 'Nesil agajy ýüklenende ýalňyşlyk ýüze çykdy',
    },
    // Person Node
    node: {
      born: 'dog.',
      died: 'ar.',
      living: 'Ýaşaýar',
      deceased: 'Aradan çykan',
      addParent: 'Ene-Ata Goş',
      addSpouse: 'Ýanýoldaş Goş',
      addChild: 'Çaga Goş',
      viewProfile: 'Profili Gör',
    },
    // Person Modal (add person)
    personModal: {
      title: 'Täze Maşgala Agzasyny Goş',
      subtitle: 'Nesil agajyňyza täze maşgala agzasyny bellige alyň',
      firstName: 'Ady',
      lastName: 'Familiýasy',
      maidenName: 'Gyzlyk Familiýasy (Islege görä)',
      gender: 'Jynsy',
      genderMale: 'Erkek',
      genderFemale: 'Aýal',
      genderOther: 'Başga',
      genderUnknown: 'Näbelli',
      birthDate: 'Doglan Senesi',
      birthPlace: 'Doglan Ýeri',
      isLiving: 'Bu maşgala agzasy ýaşaýar (diri)',
      deathDate: 'Aradan Çykan Senesi',
      deathPlace: 'Aradan Çykan Ýeri',
      biography: 'Terjimehaly / Ýatlamalar',
      biographyPlaceholder: 'Şahs barada ýatlamalar, kär we durmuş maglumatlary…',
      cancel: 'Ýatyr',
      submit: 'Maşgala Goş',
      submitting: 'Ýazdyrylýar…',
      errorRequired: 'Ady we Familiýasy hökmanydyr',
      errorGeneral: 'Şahs goşulanda ýalňyşlyk ýüze çykdy',
      placeholderFirst: 'Mysal: Ahmet',
      placeholderLast: 'Mysal: Meredow',
      placeholderMaiden: 'Bar bolsa öňki familiýasy',
      placeholderBirthPlace: 'Şäher ýa-da Ýurt',
      placeholderDeathPlace: 'Aradan çykan şäheri',
      placeholderBio: 'Şahs barada ýatlamalar, hünäri ýa-da möhüm durmuş maglumatlary…',
    },
    // Relationship Modal & Kinship
    relationModal: {
      title: 'Maşgala Bagyny Döret',
      subtitle: 'Iki maşgala agzasynyň arasynda ata-ene, nika (ýanýoldaş) ýa-da çaga bagyny guruň',
      bondCategory: 'Bagyň Esasy Bölümi',
      bondType: 'Akrabalyk / Nika Gatnaşygy',
      customTitleLabel: 'Görkeziljek Akrabalyk Ady (Islegiňize görä üýtgediň)',
      customTitlePlaceholder: 'Mysal: Ýanýoldaşy, Gelni, Äri, Gaýyn ata, Guda, Baja…',
      
      // Marriage roles
      spouseGeneral: 'Ýanýoldaş / Nika bagy',
      spouseHusband: 'Äri (Adamsy)',
      spouseWife: 'Aýaly (Gelni)',
      formerSpouse: 'Öňki Ýanýoldaş (Aýrylyşan)',
      fiance: 'Adagly (Gudaçylyk)',
      
      // In-laws
      inLawFather: 'Gaýyn ata',
      inLawMother: 'Gaýyn ene',
      inLawSon: 'Giýew',
      inLawDaughter: 'Gelin',
      inLawBrother: 'Gaýynaga / Baja',
      inLawSister: 'Baldyz / Ýüňňe',

      // Direct
      parentFather: 'Kakasy / Atasy',
      parentMother: 'Ejesi / Enesi',
      parentGeneral: 'Ene-Atasy',
      childSon: 'Ogly',
      childDaughter: 'Gyzy',
      childGeneral: 'Çagasy',
      adoptiveParent: 'Öweý / Aslyşdyrylan Ene-Ata',
      adoptiveChild: 'Öweý / Aslyşdyrylan Çaga',
      customOption: 'Ýörite / Hususy Bag Ady (Özüňiz ýazyň)',

      targetPerson: 'Baglanyşdyryljak Maşgala Agzasy',
      noPersons: 'Agajyň içinde baglanyşdyrmaga başga agza tapylmady. Ilki täze şahs goşuň.',
      marriageDate: 'Nika Senesi (Islege görä)',
      cancel: 'Ýatyr',
      submit: 'Bagy Tamamla',
      submitting: 'Ýazdyrylýar…',
      errorSelect: 'Bir maşgala agzasyny saýlaň',
      errorGeneral: 'Baglanyşyk goşulanda ýalňyşlyk ýüze çykdy',
      personLabel: '{{name}} ({{gender}}) {{birth}}',
      male: 'Erkek',
      female: 'Aýal',
    },
    // Create Tree Modal
    createTreeModal: {
      title: 'Täze Nesil Agajyny Döret',
      subtitle: 'Maşgalaňyz üçin aýratyn şejere kütügini başlaň',
      treeName: 'Nesil Agajynyň Ady',
      description: 'Düşündiriş (Islege görä)',
      placeholderName: 'Mysal: Meredowlar Nesil Agajy',
      placeholderDesc: 'Mysal: Kakasynyň tarapy Aşgabat şahasy…',
      cancel: 'Ýatyr',
      submit: 'Agajy Başlat',
      submitting: 'Döredilýär…',
      errorRequired: 'Agajyň ady hökmanydyr',
      errorGeneral: 'Agaç döredilmedi',
    },
    // Person Detail Modal (profile)
    detailModal: {
      born: 'Doglan',
      died: 'Aradan çykan',
      biography: 'Terjimehaly',
      noBiography: 'Terjimehal girizilmändir.',
      close: 'Ýap',
      edit: 'Üýtget',
      addRelative: 'Garyndaş Goş',
      addParent: 'Ene-Ata Goş',
      addSpouse: 'Ýanýoldaş Goş',
      addChild: 'Çaga Goş',
    },
    // Toast messages
    toast: {
      pngSuccess: 'Nesil agajy PNG hökmünde ýüklendi',
      pdfSuccess: 'Nesil agajy PDF hökmünde ýüklendi',
      pngError: 'PNG döredilende ýalňyşlyk boldy',
      pdfError: 'PDF döredilende ýalňyşlyk boldy',
      treeLoaded: 'Agaç ýüklendi',
    },
  },
} as const;

export default tk;
