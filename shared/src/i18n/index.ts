/**
 * BelizeChain Internationalization (i18n)
 * Support for 6 Belizean languages
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'en' | 'es' | 'kri' | 'qek' | 'gar' | 'mop';

export interface Translations {
  common: {
    loading: string;
    welcome: string;
    language: string;
    viewAll: string;
  };
  wallet: {
    connect: string;
    disconnect: string;
    balance: string;
    connected: string;
    notConnected: string;
    selectAccount: string;
    switchAccount: string;
    unnamedAccount: string;
    copyAddress: string;
    connectionError: string;
    extensionNotFound: string;
    pleaseInstallExtension: string;
    installExtension: string;
    selectProvider: string;
    browserExtension: string;
    secureConnection: string;
    currentAccount: string;
    welcomeBack: string;
    totalBalance: string;
    balanceHidden: string;
    send: string;
    receive: string;
    recentActivity: string;
    noTransactions: string;
    activityWillAppear: string;
  };
  currency: {
    bBZD: string;
    tourismRewards: string;
    earnCashback: string;
  };
  identity: {
    documents: string;
  };
  nav: {
    services: string;
  };
  governance: {
    proposal: string;
    vote: string;
    voteYes: string;
    voteNo: string;
    abstain: string;
    council: string;
    district: string;
    referendum: string;
    delegate: string;
    treasury: string;
    proposalStatus: string;
    votingPeriod: string;
    quorum: string;
    threshold: string;
    proposer: string;
    beneficiary: string;
    fundingRequest: string;
    communityFund: string;
  };
  staking: {
    stake: string;
    unstake: string;
    rewards: string;
    claimRewards: string;
    validators: string;
    nominations: string;
    nominate: string;
    era: string;
    session: string;
    commission: string;
    apy: string;
    totalStaked: string;
    activeStake: string;
    waitingValidators: string;
    slashing: string;
    bondMore: string;
    unbondAmount: string;
    rebond: string;
  };
  blockchain: {
    block: string;
    blockNumber: string;
    blockHash: string;
    transaction: string;
    extrinsic: string;
    event: string;
    hash: string;
    storage: string;
    runtime: string;
    timestamp: string;
    validator: string;
    finalized: string;
    pending: string;
    search: string;
    details: string;
  };
  business: {
    merchant: string;
    pos: string;
    pointOfSale: string;
    sales: string;
    inventory: string;
    invoice: string;
    payment: string;
    customer: string;
    product: string;
    price: string;
    quantity: string;
    total: string;
    discount: string;
    tax: string;
    receipt: string;
  };
}

const en: Translations = {
  common: { loading: 'Loading', welcome: 'Welcome', language: 'Language', viewAll: 'View All' },
  wallet: {
    connect: 'Connect Wallet',
    disconnect: 'Disconnect',
    balance: 'Balance',
    connected: 'Connected',
    notConnected: 'Not Connected',
    selectAccount: 'Select Account',
    switchAccount: 'Switch Account',
    unnamedAccount: 'Unnamed Account',
    copyAddress: 'Copy Address',
    connectionError: 'Connection Error',
    extensionNotFound: 'Extension Not Found',
    pleaseInstallExtension: 'Please install a Polkadot wallet extension',
    installExtension: 'Install Extension',
    selectProvider: 'Select Provider',
    browserExtension: 'Browser Extension',
    secureConnection: 'Secure Connection',
    currentAccount: 'Current Account',
    welcomeBack: 'Welcome Back',
    totalBalance: 'Total Balance',
    balanceHidden: 'Balance Hidden',
    send: 'Send',
    receive: 'Receive',
    recentActivity: 'Recent Activity',
    noTransactions: 'No Transactions',
    activityWillAppear: 'Activity will appear here',
  },
  currency: {
    bBZD: 'bBZD',
    tourismRewards: 'Tourism Rewards',
    earnCashback: 'Earn 5-8% cashback on eligible tourism purchases',
  },
  identity: {
    documents: 'Documents',
  },
  nav: {
    services: 'Services',
  },
  governance: {
    proposal: 'Proposal',
    vote: 'Vote',
    voteYes: 'Vote Yes',
    voteNo: 'Vote No',
    abstain: 'Abstain',
    council: 'Council',
    district: 'District',
    referendum: 'Referendum',
    delegate: 'Delegate',
    treasury: 'Treasury',
    proposalStatus: 'Proposal Status',
    votingPeriod: 'Voting Period',
    quorum: 'Quorum',
    threshold: 'Threshold',
    proposer: 'Proposer',
    beneficiary: 'Beneficiary',
    fundingRequest: 'Funding Request',
    communityFund: 'Community Fund',
  },
  staking: {
    stake: 'Stake',
    unstake: 'Unstake',
    rewards: 'Rewards',
    claimRewards: 'Claim Rewards',
    validators: 'Validators',
    nominations: 'Nominations',
    nominate: 'Nominate',
    era: 'Era',
    session: 'Session',
    commission: 'Commission',
    apy: 'APY',
    totalStaked: 'Total Staked',
    activeStake: 'Active Stake',
    waitingValidators: 'Waiting Validators',
    slashing: 'Slashing',
    bondMore: 'Bond More',
    unbondAmount: 'Unbond Amount',
    rebond: 'Rebond',
  },
  blockchain: {
    block: 'Block',
    blockNumber: 'Block Number',
    blockHash: 'Block Hash',
    transaction: 'Transaction',
    extrinsic: 'Extrinsic',
    event: 'Event',
    hash: 'Hash',
    storage: 'Storage',
    runtime: 'Runtime',
    timestamp: 'Timestamp',
    validator: 'Validator',
    finalized: 'Finalized',
    pending: 'Pending',
    search: 'Search',
    details: 'Details',
  },
  business: {
    merchant: 'Merchant',
    pos: 'POS',
    pointOfSale: 'Point of Sale',
    sales: 'Sales',
    inventory: 'Inventory',
    invoice: 'Invoice',
    payment: 'Payment',
    customer: 'Customer',
    product: 'Product',
    price: 'Price',
    quantity: 'Quantity',
    total: 'Total',
    discount: 'Discount',
    tax: 'Tax',
    receipt: 'Receipt',
  },
};

const es: Translations = {
  common: { loading: 'Cargando', welcome: 'Bienvenido', language: 'Idioma', viewAll: 'Ver Todo' },
  wallet: {
    connect: 'Conectar Billetera',
    disconnect: 'Desconectar',
    balance: 'Saldo',
    connected: 'Conectado',
    notConnected: 'No Conectado',
    selectAccount: 'Seleccionar Cuenta',
    switchAccount: 'Cambiar Cuenta',
    unnamedAccount: 'Cuenta Sin Nombre',
    copyAddress: 'Copiar Dirección',
    connectionError: 'Error de Conexión',
    extensionNotFound: 'Extensión No Encontrada',
    pleaseInstallExtension: 'Por favor instale una extensión de billetera Polkadot',
    installExtension: 'Instalar Extensión',
    selectProvider: 'Seleccionar Proveedor',
    browserExtension: 'Extensión del Navegador',
    secureConnection: 'Conexión Segura',
    currentAccount: 'Cuenta Actual',
    welcomeBack: 'Bienvenido de Nuevo',
    totalBalance: 'Saldo Total',
    balanceHidden: 'Saldo Oculto',
    send: 'Enviar',
    receive: 'Recibir',
    recentActivity: 'Actividad Reciente',
    noTransactions: 'Sin Transacciones',
    activityWillAppear: 'La actividad aparecerá aquí',
  },
  currency: {
    bBZD: 'bBZD',
    tourismRewards: 'Recompensas de Turismo',
    earnCashback: 'Gane 5-8% de reembolso en compras turísticas elegibles',
  },
  identity: {
    documents: 'Documentos',
  },
  nav: {
    services: 'Servicios',
  },
  governance: {
    proposal: 'Propuesta',
    vote: 'Votar',
    voteYes: 'Votar Sí',
    voteNo: 'Votar No',
    abstain: 'Abstener',
    council: 'Consejo',
    district: 'Distrito',
    referendum: 'Referéndum',
    delegate: 'Delegar',
    treasury: 'Tesoro',
    proposalStatus: 'Estado de Propuesta',
    votingPeriod: 'Período de Votación',
    quorum: 'Quórum',
    threshold: 'Umbral',
    proposer: 'Proponente',
    beneficiary: 'Beneficiario',
    fundingRequest: 'Solicitud de Financiamiento',
    communityFund: 'Fondo Comunitario',
  },
  staking: {
    stake: 'Apostar',
    unstake: 'Desapostar',
    rewards: 'Recompensas',
    claimRewards: 'Reclamar Recompensas',
    validators: 'Validadores',
    nominations: 'Nominaciones',
    nominate: 'Nominar',
    era: 'Era',
    session: 'Sesión',
    commission: 'Comisión',
    apy: 'TAE',
    totalStaked: 'Total Apostado',
    activeStake: 'Apuesta Activa',
    waitingValidators: 'Validadores en Espera',
    slashing: 'Penalización',
    bondMore: 'Aumentar Vínculo',
    unbondAmount: 'Monto a Desvincular',
    rebond: 'Revincular',
  },
  blockchain: {
    block: 'Bloque',
    blockNumber: 'Número de Bloque',
    blockHash: 'Hash de Bloque',
    transaction: 'Transacción',
    extrinsic: 'Extrínseco',
    event: 'Evento',
    hash: 'Hash',
    storage: 'Almacenamiento',
    runtime: 'Tiempo de Ejecución',
    timestamp: 'Marca de Tiempo',
    validator: 'Validador',
    finalized: 'Finalizado',
    pending: 'Pendiente',
    search: 'Buscar',
    details: 'Detalles',
  },
  business: {
    merchant: 'Comerciante',
    pos: 'POS',
    pointOfSale: 'Punto de Venta',
    sales: 'Ventas',
    inventory: 'Inventario',
    invoice: 'Factura',
    payment: 'Pago',
    customer: 'Cliente',
    product: 'Producto',
    price: 'Precio',
    quantity: 'Cantidad',
    total: 'Total',
    discount: 'Descuento',
    tax: 'Impuesto',
    receipt: 'Recibo',
  },
};

const kri: Translations = {
  common: { loading: 'Di Lood', welcome: 'Welkom', language: 'Langwij', viewAll: 'Si Aal' },
  wallet: {
    connect: 'Konekt Walit',
    disconnect: 'Diskanak',
    balance: 'Balans',
    connected: 'Konektid',
    notConnected: 'No Konektid',
    selectAccount: 'Selekt Akount',
    switchAccount: 'Swich Akount',
    unnamedAccount: 'Unnamed Akount',
    copyAddress: 'Kapi Adres',
    connectionError: 'Konekshan Erah',
    extensionNotFound: 'Extenshahn No Fayn',
    pleaseInstallExtension: 'Pleez instaal wan Polkadot walit extenshahn',
    installExtension: 'Instaal Extenshahn',
    selectProvider: 'Pik Provayda',
    browserExtension: 'Browza Extenshahn',
    secureConnection: 'Shoo Konekshan',
    currentAccount: 'Kerahn Akount',
    welcomeBack: 'Welkom Bak',
    totalBalance: 'Toh tal Balans',
    balanceHidden: 'Balans Haid',
    send: 'Sen',
    receive: 'Reesiv',
    recentActivity: 'Reesahn Aktivity',
    noTransactions: 'No Transakshahn',
    activityWillAppear: 'Aktivity wi sho op yah',
  },
  currency: {
    bBZD: 'bBZD',
    tourismRewards: 'Tooris Riwod',
    earnCashback: 'Ahn 5-8% kashbak pan eligibl tooris op',
  },
  identity: {
    documents: 'Dakiyument',
  },
  nav: {
    services: 'Sohvis',
  },
  governance: {
    proposal: 'Propozal',
    vote: 'Voat',
    voteYes: 'Voat Yes',
    voteNo: 'Voat No',
    abstain: 'No Voat',
    council: 'Kownsl',
    district: 'Distrikt',
    referendum: 'Referendom',
    delegate: 'Delegayt',
    treasury: 'Trezri',
    proposalStatus: 'Propozal Staytus',
    votingPeriod: 'Voating Piryod',
    quorum: 'Kworum',
    threshold: 'Limit',
    proposer: 'Di Wan Weh Propoz',
    beneficiary: 'Benefishiari',
    fundingRequest: 'Fonding Rikwes',
    communityFund: 'Komyuniti Fond',
  },
  staking: {
    stake: 'Stayk',
    unstake: 'Anstayk',
    rewards: 'Riwod',
    claimRewards: 'Klaym Riwod',
    validators: 'Validayta',
    nominations: 'Naminayshan',
    nominate: 'Naminayt',
    era: 'Era',
    session: 'Seshan',
    commission: 'Komishan',
    apy: 'APY',
    totalStaked: 'Toh tal Stayked',
    activeStake: 'Aktiv Stayk',
    waitingValidators: 'Validayta Wayting',
    slashing: 'Slashing',
    bondMore: 'Bond Mor',
    unbondAmount: 'Anbond Amown',
    rebond: 'Riebond',
  },
  blockchain: {
    block: 'Blak',
    blockNumber: 'Blak Nomba',
    blockHash: 'Blak Hash',
    transaction: 'Transakshahn',
    extrinsic: 'Ekstrinsik',
    event: 'Ivent',
    hash: 'Hash',
    storage: 'Stoarij',
    runtime: 'Runtime',
    timestamp: 'Taym Stamp',
    validator: 'Validayta',
    finalized: 'Faynal',
    pending: 'Pending',
    search: 'Sayrch',
    details: 'Diteyl',
  },
  business: {
    merchant: 'Marchy ant',
    pos: 'POS',
    pointOfSale: 'Sayling Poynt',
    sales: 'Sayl',
    inventory: 'Inventori',
    invoice: 'Invo is',
    payment: 'Payment',
    customer: 'Kostoma',
    product: 'Praduk',
    price: 'Prays',
    quantity: 'Kwontiti',
    total: 'Toh tal',
    discount: 'Diskownt',
    tax: 'Taks',
    receipt: 'Reesit',
  },
};

const qek: Translations = {
  common: { loading: 'Yookin', welcome: 'Chahil', language: 'Aatin', viewAll: 'Nab-i' },
  wallet: {
    connect: 'Tzaqal Walit',
    disconnect: 'Sachbal',
    balance: 'Raqal',
    connected: 'Tzaqan',
    notConnected: 'Ma us tzaqan',
    selectAccount: 'Sikok pwaq',
    switchAccount: 'Jalok pwaq',
    unnamedAccount: 'Ma us bi',
    copyAddress: 'Jolok',
    connectionError: 'Sachbal tzaqal',
    extensionNotFound: 'Ma narilan',
    pleaseInstallExtension: 'Tarokresiheb jun extenshahn Polkadot walit',
    installExtension: 'Kanjel extenshahn',
    selectProvider: 'Sikok ajkane',
    browserExtension: 'Extenshahn browser',
    secureConnection: 'Tzaqal chaq',
    currentAccount: 'Pwaq anaqwan',
    welcomeBack: 'Chahil sut',
    totalBalance: 'Raqal ronq',
    balanceHidden: 'Raqal mukeleb',
    send: 'Taqe',
    receive: 'Kaamuheb',
    recentActivity: 'Banuhom anaqwan',
    noTransactions: 'Ma us banuhom',
    activityWillAppear: 'Li banuhom narilan waye',
  },
  currency: {
    bBZD: 'bBZD',
    tourismRewards: 'Tojleb re turis',
    earnCashback: 'Kaamuheb 5-8% tojleb re lokol turis',
  },
  identity: {
    documents: 'Hu',
  },
  nav: {
    services: 'Paatanq',
  },
  governance: {
    proposal: 'Katzolok',
    vote: 'Aatin',
    voteYes: 'Aatin usilal',
    voteNo: 'Aatin inkeb',
    abstain: 'Ma aatiniik',
    council: 'Nimla aatin',
    district: 'Tenamit',
    referendum: 'Aatin reheb',
    delegate: 'Taklan',
    treasury: 'Pwaq tenamit',
    proposalStatus: 'Katzolok eb li',
    votingPeriod: 'Tiempo aatin',
    quorum: 'Usilal raatin',
    threshold: 'Limite',
    proposer: 'Li katzolok',
    beneficiary: 'Kaamuheb',
    fundingRequest: 'Katzolok pwaq',
    communityFund: 'Pwaq tenamit',
  },
  staking: {
    stake: 'Kanabeb',
    unstake: 'Kesebeb',
    rewards: 'Tojleb',
    claimRewards: 'Kaamuheb tojleb',
    validators: 'Validayta',
    nominations: 'Kachal',
    nominate: 'Chalaneb',
    era: 'Kutan',
    session: 'Tiempo',
    commission: 'Tojleb paatanq',
    apy: 'APY',
    totalStaked: 'Raqal kanabeb',
    activeStake: 'Kanabeb anaqwan',
    waitingValidators: 'Validayta nakoyan',
    slashing: 'Sachbal',
    bondMore: 'Kanjel nabal',
    unbondAmount: 'Keseb ronq',
    rebond: 'Sut kanabeb',
  },
  blockchain: {
    block: 'Bloke',
    blockNumber: 'Jiil bloke',
    blockHash: 'Hash bloke',
    transaction: 'Banuhom',
    extrinsic: 'Meyah',
    event: 'Nimla',
    hash: 'Hash',
    storage: 'Kolol',
    runtime: 'Tiempo meyah',
    timestamp: 'Jiil tiempo',
    validator: 'Validayta',
    finalized: 'Qaseb',
    pending: 'Nakoyan',
    search: 'Siik',
    details: 'Naab-i',
  },
  business: {
    merchant: 'Lokol',
    pos: 'POS',
    pointOfSale: 'Lokol kolebaal',
    sales: 'Kolebaal',
    inventory: 'Li us',
    invoice: 'Hu kolebaal',
    payment: 'Tojleb',
    customer: 'Li lokol',
    product: 'Banuhom',
    price: 'Pwaq',
    quantity: 'Kabal',
    total: 'Raqal',
    discount: 'Nabalin pwaq',
    tax: 'Tojleb re tenamit',
    receipt: 'Hu tojleb',
  },
};

const gar: Translations = {
  common: { loading: 'Abeigülei', welcome: 'Buiti binafi', language: 'Duna', viewAll: 'Afidi' },
  wallet: {
    connect: 'Güdürü Walit',
    disconnect: 'Gúmadi',
    balance: 'Gani',
    connected: 'Güdürügu',
    notConnected: 'Mana güdürügu',
    selectAccount: 'Abi gani',
    switchAccount: 'Güdürü gani',
    unnamedAccount: 'Mana rina',
    copyAddress: 'Arudi lidan',
    connectionError: 'Gúmadi güdürü',
    extensionNotFound: 'Mana alüha',
    pleaseInstallExtension: 'Garaüdü luma extenshahn Polkadot walit',
    installExtension: 'Garaüdü extenshahn',
    selectProvider: 'Abi agáyuha',
    browserExtension: 'Extenshahn browser',
    secureConnection: 'Güdürü chaq',
    currentAccount: 'Gani uwana',
    welcomeBack: 'Buiti sut',
    totalBalance: 'Gani gadenau',
    balanceHidden: 'Gani mulun',
    send: 'Güdüru',
    receive: 'Aragia',
    recentActivity: 'Gabu abiña',
    noTransactions: 'Mana gabu',
    activityWillAppear: 'Gabu abunei dügü',
  },
  currency: {
    bBZD: 'bBZD',
    tourismRewards: 'Wügüri turismu',
    earnCashback: 'Aragia 5-8% wügüri turismu gabu',
  },
  identity: {
    documents: 'Wügüri hu',
  },
  nav: {
    services: 'Garaüdü',
  },
  governance: {
    proposal: 'Kalaligu',
    vote: 'Arugun',
    voteYes: 'Arugun hau',
    voteNo: 'Arugun ayo',
    abstain: 'Mana arugun',
    council: 'Gamara',
    district: 'Barü',
    referendum: 'Arugun gani',
    delegate: 'Gudeteli',
    treasury: 'Wügüri barü',
    proposalStatus: 'Kalaligu wadü',
    votingPeriod: 'Giemeru arugun',
    quorum: 'Hau arugun',
    threshold: 'Limite',
    proposer: 'Lau kalaligu',
    beneficiary: 'Aragia lau',
    fundingRequest: 'Kalaligu wügüri',
    communityFund: 'Wügüri barü',
  },
  staking: {
    stake: 'Gadenau',
    unstake: 'Gererun',
    rewards: 'Wügüri',
    claimRewards: 'Aragia wügüri',
    validators: 'Validayta',
    nominations: 'Güdüreteli',
    nominate: 'Gudeteli',
    era: 'Giemeru',
    session: 'Giemeru',
    commission: 'Wügüri gabu',
    apy: 'APY',
    totalStaked: 'Gani gadenau',
    activeStake: 'Gadenau abiña',
    waitingValidators: 'Validayta wamei',
    slashing: 'Gererun',
    bondMore: 'Gadenau nabal',
    unbondAmount: 'Gererun kabal',
    rebond: 'Sut gadenau',
  },
  blockchain: {
    block: 'Blok',
    blockNumber: 'Jiil blok',
    blockHash: 'Hash blok',
    transaction: 'Gabu',
    extrinsic: 'Gabu barü',
    event: 'Nimla',
    hash: 'Hash',
    storage: 'Kolol',
    runtime: 'Giemeru gabu',
    timestamp: 'Jiil giemeru',
    validator: 'Validayta',
    finalized: 'Qaseb',
    pending: 'Wamei',
    search: 'Güdürü siik',
    details: 'Naab-i',
  },
  business: {
    merchant: 'Burawan',
    pos: 'POS',
    pointOfSale: 'Burawan dügü',
    sales: 'Kolebaal',
    inventory: 'Gabu us',
    invoice: 'Hu kolebaal',
    payment: 'Wügüri',
    customer: 'Lau burawan',
    product: 'Gabu',
    price: 'Wügüri',
    quantity: 'Kabal',
    total: 'Gani',
    discount: 'Nabalin wügüri',
    tax: 'Wügüri barü',
    receipt: 'Hu wügüri',
  },
};

const mop: Translations = {
  common: { loading: 'T kaaxal', welcome: 'Kiimak a wooch', language: 'Taan', viewAll: 'Ilaj tuul' },
  wallet: {
    connect: 'Tsook Walit',
    disconnect: 'Jaats',
    balance: 'Taak',
    connected: 'Tsook',
    notConnected: 'Ma tsook',
    selectAccount: 'Kaj taak',
    switchAccount: 'Jats taak',
    unnamedAccount: 'Ma kaaba',
    copyAddress: 'Tsaj',
    connectionError: 'Jaats tsook',
    extensionNotFound: 'Ma ilaj',
    pleaseInstallExtension: 'Kaaba u kaxtik jun extenshahn Polkadot walit',
    installExtension: 'Kaaba extenshahn',
    selectProvider: 'Kaj ajkun',
    browserExtension: 'Extenshahn browser',
    secureConnection: 'Tsook chokoy',
    currentAccount: 'Taak bejla',
    welcomeBack: 'Kiimak sut',
    totalBalance: 'Taak tuul',
    balanceHidden: 'Taak mukul',
    send: 'Tuk',
    receive: 'Hach',
    recentActivity: 'Meyah bejla',
    noTransactions: 'Ma meyah',
    activityWillAppear: 'Meyah u binel waye',
  },
  currency: {
    bBZD: 'bBZD',
    tourismRewards: 'Taak turismu',
    earnCashback: 'Hach 5-8% taak turismu meyah',
  },
  identity: {
    documents: 'Hu',
  },
  nav: {
    services: 'Meyah',
  },
  governance: {
    proposal: 'Katal',
    vote: 'Aatin',
    voteYes: 'Aatin jach',
    voteNo: 'Aatin ma',
    abstain: 'Ma aatin',
    council: 'Konsejo',
    district: 'Kaaj',
    referendum: 'Aatin tuul',
    delegate: 'Taklan',
    treasury: 'Taak kaaj',
    proposalStatus: 'Katal u je',
    votingPeriod: 'Tiempo aatin',
    quorum: 'Jach aatin',
    threshold: 'Limite',
    proposer: 'Leti katal',
    beneficiary: 'Hach leti',
    fundingRequest: 'Katal taak',
    communityFund: 'Taak kaaj',
  },
  staking: {
    stake: 'Kanab',
    unstake: 'Keseb',
    rewards: 'Taak',
    claimRewards: 'Hach taak',
    validators: 'Validayta',
    nominations: 'Kachal',
    nominate: 'Chalaneb',
    era: 'Kutan',
    session: 'Tiempo',
    commission: 'Taak meyah',
    apy: 'APY',
    totalStaked: 'Kanab tuul',
    activeStake: 'Kanab bejla',
    waitingValidators: 'Validayta kaayan',
    slashing: 'Keseb',
    bondMore: 'Kanab mas',
    unbondAmount: 'Keseb taak',
    rebond: 'Sut kanab',
  },
  blockchain: {
    block: 'Bloke',
    blockNumber: 'Jiil bloke',
    blockHash: 'Hash bloke',
    transaction: 'Meyah',
    extrinsic: 'Meyah kaaj',
    event: 'Nimla',
    hash: 'Hash',
    storage: 'Kolol',
    runtime: 'Tiempo meyah',
    timestamp: 'Jiil tiempo',
    validator: 'Validayta',
    finalized: 'Taas',
    pending: 'Kaayan',
    search: 'Kaxtik',
    details: 'Ilaj tuul',
  },
  business: {
    merchant: 'Lokol',
    pos: 'POS',
    pointOfSale: 'Lokol konel',
    sales: 'Konel',
    inventory: 'Li us',
    invoice: 'Hu konel',
    payment: 'Taak',
    customer: 'Leti lokol',
    product: 'Meyah',
    price: 'Taak',
    quantity: 'Kabal',
    total: 'Tuul',
    discount: 'Nabalin taak',
    tax: 'Taak kaaj',
    receipt: 'Hu taak',
  },
};

const translations = { en, es, kri, qek, gar, mop };

interface I18nState {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'en',
      t: translations.en,
      setLocale: (locale: Locale) => {
        set({ locale, t: translations[locale] });
      },
    }),
    {
      name: 'belizechain-locale',
      // SSR-safe: skip hydration on server, will rehydrate on client
      skipHydration: true,
    }
  )
);

// Rehydrate the store on client-side
if (typeof window !== 'undefined') {
  useI18n.persist.rehydrate();
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

export const localeInfo = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  kri: { name: 'Kriol', nativeName: 'Kriol', flag: '🇧🇿' },
  qek: { name: 'Qeqchi', nativeName: 'Qeqchi Maya', flag: '🇬🇹' },
  gar: { name: 'Garifuna', nativeName: 'Garífuna', flag: '🇭🇳' },
  mop: { name: 'Mopan', nativeName: 'Mopan Maya', flag: '🇧🇿' },
};
