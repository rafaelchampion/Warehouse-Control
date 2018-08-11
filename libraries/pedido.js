class Pedido {
    constructor(grid) {
        this.codigo;
        this.status = "Pendente";
        this.celulaPrateleiraItem;
        this.celulaReceptor;

        this.getPrateleiraItem(grid);
        this.getReceptor();
    }
    atualizaStatus(novoStatus) {
        this.status = novoStatus;
    }

    getPrateleiraItem(grid) {
        let randX;
        let randY;
        do {
            randX = Math.floor(Math.random() * grid[0].length);
            randY = Math.floor(Math.random() * grid.length);
        } while (grid[randX][randY].shelf == false || grid[randX][randY].isTarget === true);
        let targetCell = grid[randX][randY];
        this.celulaPrateleiraItem = targetCell;
    }

    getReceptor() {
        let receptorIndice = Math.round(Math.random() * (receptores.length - 1));
        this.celulaReceptor = receptores[receptorIndice].celula;
    }
}