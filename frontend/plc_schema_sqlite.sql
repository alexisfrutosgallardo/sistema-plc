
CREATE TABLE Usuario (
    UsuCodigo TEXT PRIMARY KEY,
    legajo TEXT NOT NULL,
    UsuNombre TEXT NOT NULL,
    fecha_cat TEXT NOT NULL
);

CREATE TABLE Producto (
    ProdCodigo TEXT PRIMARY KEY,
    TipProdCodigo INTEGER NOT NULL,
    ProdNombre TEXT NOT NULL,
    Estado TEXT NOT NULL,
    Stock REAL,
    HorasCura INTEGER,
    Usuario TEXT,
    FechaCat TEXT
);

CREATE TABLE Silo (
    SiloCodigo TEXT PRIMARY KEY,
    SiloNombre TEXT NOT NULL,
    IP TEXT,
    Estado TEXT,
    Usuario TEXT,
    FechaCat TEXT
);

CREATE TABLE TipoProducto (
    TipProdCodigo INTEGER PRIMARY KEY,
    TipProdNombre TEXT NOT NULL,
    Usuario TEXT,
    FechaCat TEXT
);

CREATE TABLE Entrada1 (
    EntNumero INTEGER PRIMARY KEY,
    Fecha TEXT NOT NULL,
    NroCorte TEXT NOT NULL,
    Estado TEXT NOT NULL,
    Comentario TEXT,
    FechaCat TEXT NOT NULL,
    Usuario TEXT
);

CREATE TABLE Entrada2 (
    EntNumero INTEGER NOT NULL,
    Iten INTEGER,
    ProdCodigo TEXT NOT NULL,
    Serie TEXT NOT NULL,
    Cantidad REAL NOT NULL,
    Fecha TEXT NOT NULL,
    FechaCura TEXT NOT NULL,
    FechaIngr TEXT,
    Estado TEXT NOT NULL,
    Usuario TEXT,
    FechaCat TEXT,
    FOREIGN KEY (ProdCodigo) REFERENCES Producto (ProdCodigo),
    FOREIGN KEY (EntNumero) REFERENCES Entrada1 (EntNumero)
);

CREATE TABLE Maquina (
    MaqCodigo TEXT PRIMARY KEY,
    MaqNombre TEXT NOT NULL,
    Usuario TEXT,
    FechaCat TEXT
);

CREATE TABLE Salida (
    SalNumero INTEGER PRIMARY KEY,
    Iten INTEGER NOT NULL,
    NroRelacion INTEGER NOT NULL,
    ProdCodigo TEXT NOT NULL,
    Corte INTEGER NOT NULL,
    Serie TEXT NOT NULL,
    Cantidad REAL,
    Usuario TEXT NOT NULL,
    FechaCat TEXT,
    Estado TEXT NOT NULL,
    FOREIGN KEY (ProdCodigo) REFERENCES Producto (ProdCodigo),
    FOREIGN KEY (NroRelacion) REFERENCES RelSiloBlend1 (NroRelacion)
);

CREATE TABLE RelSiloBlend1 (
    NroRelacion INTEGER PRIMARY KEY,
    ProdCodigo TEXT NOT NULL,
    SiloCodigo TEXT NOT NULL,
    Corte INTEGER,
    Estado TEXT,
    FechaCat TEXT,
    Usuario TEXT,
    FOREIGN KEY (ProdCodigo) REFERENCES Producto (ProdCodigo),
    FOREIGN KEY (SiloCodigo) REFERENCES Silo (SiloCodigo)
);

CREATE TABLE RelSiloBlen2 (
    NroRelacion INTEGER NOT NULL,
    Iten INTEGER,
    MaqCodigo TEXT NOT NULL,
    FOREIGN KEY (MaqCodigo) REFERENCES Maquina (MaqCodigo),
    FOREIGN KEY (NroRelacion) REFERENCES RelSiloBlend1 (NroRelacion)
);
