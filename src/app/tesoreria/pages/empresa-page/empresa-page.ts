import { ChangeDetectionStrategy, Component, inject, signal, ViewChild } from '@angular/core';
import { EmpresaService } from '../../../../services/tesoreria/empresa.service';
import { TipoMonedaService } from '../../../../services/tesoreria/tipo-moneda.service';
import { IEmpresa, ITipoMoneda } from '../../../../interfaces/tesoreria';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';

interface IPagination {
  page: number;
  pageSize: number;
  totalItems: number;
}

@Component({
  selector: 'app-empresa-page',
  imports: [RouterLink, CustomIconComponent],
  templateUrl: './empresa-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EmpresaPageComponent { 

  empresaService = inject(EmpresaService);
  tipoMonedaService = inject(TipoMonedaService);
  empresaList = signal<IEmpresa[]>([]);
  tipoMonedaList = signal<ITipoMoneda[]>([]);
  metadata = signal({});
  nuevaEmpresa = signal(true);
  empresaEdit = signal<IEmpresa>({
    empresaId: '',
    nombre: '',
    direccion: '',
    nit: '',
    telefono: 0,
    tipoMonedaId: '',
  });

  pagination = signal<IPagination>({
    page: 1,
    pageSize: 10,
    totalItems: 0
  });
  
  isLoading = signal(false);
  
  modal = signal({
    titulo: 'Crear Empresa',
    visible: false,
  });

  buscador = signal('');

  // Para usar Math en el template
  Math = Math;

  constructor() { }

  async ngOnInit() {
    this.empresaList.set([]);
    await this.fetchTipoMonedas(); // Cargar tipos de moneda para el select
    this.fetchData();
  }

  async fetchTipoMonedas() {
    const response = await this.tipoMonedaService.getTipoMonedas({ all: true });
    if (response?.success) {
      this.tipoMonedaList.set(response.data);
    }
  }

  async fetchData() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    const response = await this.empresaService.getEmpresas({
      page: this.pagination().page,
      limit: this.pagination().pageSize,
      busqueda: this.buscador()
    });

    if (response?.success) {
      this.empresaList.set(response.data);
      if (response.metadata) {
        this.pagination.update(p => ({
          ...p,
          totalItems: response.metadata?.total || 0
        }));
      }
    }
    this.isLoading.set(false);
  }

  onSearch(searchTerm: string) {
    this.buscador.set(searchTerm);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.fetchData();
  }

  onPageChange(page: number) {
    this.pagination.update(p => ({ ...p, page }));
    this.fetchData();
  }

  openCreateModal() {
    this.nuevaEmpresa.set(true);
    this.empresaEdit.set({
      empresaId: '',
      nombre: '',
      direccion: '',
      nit: '',
      telefono: 0,
      tipoMonedaId: '',
    });
    this.modal.update(m => ({
      ...m,
      titulo: 'Crear Empresa',
      visible: true
    }));
  }

  openEditModal(empresa: IEmpresa) {
    this.nuevaEmpresa.set(false);
    this.empresaEdit.set({ ...empresa });
    this.modal.update(m => ({
      ...m,
      titulo: 'Editar Empresa',
      visible: true
    }));
  }

  closeModal() {
    this.modal.update(m => ({ ...m, visible: false }));
  }

  async saveEmpresa() {
    const empresa = this.empresaEdit();
    let response;

    if (this.nuevaEmpresa()) {
      const { empresaId, ...empresaData } = empresa;
      response = await this.empresaService.createEmpresa(empresaData);
    } else {
      response = await this.empresaService.updateEmpresa(empresa);
    }

    if (response?.success) {
      this.closeModal();
      this.fetchData();
    }
  }

  async deleteEmpresa(empresa: IEmpresa) {
    if (confirm(`¿Está seguro de eliminar la empresa "${empresa.nombre}"?`)) {
      const response = await this.empresaService.deleteEmpresa(empresa.empresaId);
      if (response?.success) {
        this.fetchData();
      }
    }
  }

  updateEmpresaField(field: keyof IEmpresa, value: any) {
    this.empresaEdit.update(empresa => ({
      ...empresa,
      [field]: value
    }));
  }

  getTipoMonedaNombre(tipoMonedaId: string): string {
    const tipoMoneda = this.tipoMonedaList().find(tm => tm.tipoMonedaId === tipoMonedaId);
    return tipoMoneda ? `${tipoMoneda.descripcion} (${tipoMoneda.simbolo})` : 'No definido';
  }
}
