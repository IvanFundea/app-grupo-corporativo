import { ChangeDetectionStrategy, Component, inject, signal, ViewChild } from '@angular/core';
import { TipoMonedaService } from '../../../../services/tesoreria/tipo-moneda.service';
import { ITipoMoneda } from '../../../../interfaces/tesoreria';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';

@Component({
  selector: 'app-tipo-moneda-page',
  imports: [RouterLink, CustomIconComponent],
  templateUrl: './tipo-moneda-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TipoMonedaPageComponent { 

  tipoMonedaService = inject(TipoMonedaService);
  tipoMonedaList = signal<ITipoMoneda[]>([]);
  metadata = signal({})// Cambia el tipo según tu modelo de datos
  nuevoTipoMoneda = signal(true)
  tipoMonedaEdit = signal<ITipoMoneda>({
    tipoMonedaId: '',
    descripcion: '',
    simbolo: '',
  });

  pagination = signal<IPagination>({
    page: 1,
    pageSize: 10,
    totalItems: 0
  })
  isLoading = signal(false);
  

  modal = signal({
    titulo: 'Crear Rol',
    visible: false,
  });

  buscador = signal('');

  constructor() { }

  ngOnInit() {

    this.tipoMonedaList.set([]); // Limpiamos la lista antes de cargar nuevos datos
    this.fetchData();
  }


  async fetchData() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    let resp = await this.tipoMonedaService.getTipoMonedas({ page: this.pagination().page, limit: this.pagination().pageSize, busqueda: this.buscador() });
    console.log("🚀 ~ TipoMonedaPageComponent ~ fetchData ~ resp:", resp)
    if (resp) {
      let { data, metadata } = resp;
      this.tipoMonedaList.set(data);
      this.metadata.set(metadata || {});
      this.pagination.set({
        page: metadata?.page || 1,
        pageSize: metadata?.limit || 10,
        totalItems: metadata?.total || 0
      });
    }
    this.isLoading.set(false);
  }

  async deleteTipoMoneda(tipoMoneda: ITipoMoneda) {
    let resp = await this.tipoMonedaService.deleteTipoMoneda(tipoMoneda.tipoMonedaId);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  async createTipoMoneda(tipoMoneda: ITipoMoneda) {
    let resp = await this.tipoMonedaService.createTipoMoneda(tipoMoneda);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.tipoMonedaEdit.set({
        tipoMonedaId: '',
        descripcion: '',
        simbolo: '',
      });
      this.nuevoTipoMoneda.set(true); // Reseteamos el estado de nuevo tipo de moneda
    }
  }

  async updateTipoMoneda(tipoMoneda: ITipoMoneda) {
    let resp = await this.tipoMonedaService.updateTipoMoneda(tipoMoneda);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  onChangePage(newPagination: IPagination) {
    this.tipoMonedaList.set([]); // Limpiamos la lista antes de cargar nuevos datos
    this.pagination.set(newPagination);
    this.fetchData();
  }

  async upsertTipoMoneda(tipoMoneda: ITipoMoneda) {
    if (!tipoMoneda.tipoMonedaId) {
      this.createTipoMoneda(tipoMoneda);
    } else {
      this.updateTipoMoneda(tipoMoneda);
    }
  }

  openModal(nuevo: boolean = true, tipoMoneda: ITipoMoneda = { tipoMonedaId: '', descripcion: '', simbolo: '' }) {
    this.nuevoTipoMoneda.set(nuevo);

    if (this.nuevoTipoMoneda()) {
      this.tipoMonedaEdit.set({
        tipoMonedaId: '',
        descripcion: '',
        simbolo: '',
      });
      this.modal.set({
        titulo: 'Crear Tipo de Moneda',
        visible: true,
      });
    } else {
      this.tipoMonedaEdit.set(tipoMoneda);
      this.modal.set({
        titulo: 'Actualizar Tipo de Moneda',
        visible: true,
      });
    }
  }

  closeModal() {
    
  }

  openDeleteModal(tipoMoneda: ITipoMoneda) {
    this.tipoMonedaEdit.set(tipoMoneda);
    this.modal.set({
      titulo: tipoMoneda.tipoMonedaId ? 'Actualizar Tipo de Moneda' : 'Crear Tipo de Moneda',
      visible: true,
    });
  }

}
