import * as React from 'react';
import { IResult, Related, IEntitySearch, IFacet, IFilterModel, IFilterBase } from '@fenix/tf-search-model';
import { TableFenix } from '@fenix/fenix-components';
import { ctxt, IFenixStoreElement } from './../FenixProvider';
import { ITableFilterInputConnect } from '../../model/TableFenix/input';
import { IEntityNameId } from '@fenix/fenix-components/dist/components/Table/base/model';

export interface INestedTableFenixProps {
  entity: number; // índice de la entidad de la tabla.
  result: { [pathname: string]: { [num: number]: IResult } } | undefined; // source desde redux.
  isLoading: boolean; // loading, desde redux
  itemPerPage: number; // items por página
  error: Error | string | null; // error desde redux.
  propIndexName: number; // nombre de la tabla
  pathName: string; // ruta de edición
  enumValue: (indexEnun: number, valueEnum: number) => string; // entrega el nombre de una enumeración.
  onLoad?: (input: ITableFilterInputConnect) => void; // evento de carga de datos
  headerRelated: (header: number) => string; // función para obtener entidades.
  headerProperty: (header: number, typeRelated: Related) => string; // función para obtener los nombres de las propiedades.
  cellheaders?: JSX.Element[]; // cabecera de celdas extras 
  cells?: ((elem: IEntitySearch) => JSX.Element)[]; // celdas extras
  filter?: boolean; // si está activado el filtro.
}


// modelo del state
export interface INestedTableFenixState {
    currentPage:number, // página actual
    currentFilter : IFilterModel // modelo de filtros
}


// table fenix
export class TableSearchFenix extends React.Component<INestedTableFenixProps,INestedTableFenixState>{

 
  constructor(props : INestedTableFenixProps) {
    super(props);
    
    this.selectPage.bind(this); // selección de página
    this.filters.bind(this); // filtros
    this.clean.bind(this); // limpia filtros
    this.state = {currentPage: 1, currentFilter :{}} // state inicial
    

  }
  public render(){
    

    return (<ctxt.Consumer>
      {context => {
        if (context) {

          // propiedades
          const {onLoad, entity, itemPerPage, propIndexName, pathName, result} = this.props;

          // si existe el método onLoad y la tabla de un índice aún no ha cargado.
          if (onLoad && !context.loadedTableComponent?.get(entity)) {
            // inicializa, indicando que la tabla aún no ha sido cargada
            context.loadedTableComponent.set(entity, false);
            // ejecuta redux con la consulta
            onLoad({
              url: context.connect.searchConnect.url, // url de azure
              elementsInPage: itemPerPage, // numero de elementos en la página
              entity, // índice de la tabla
              index: context.connect.searchConnect.index, // índice en azure.
              key: context.connect.searchConnect.key, // clave del azure.
              page: 1, // página a cargar
              propIndexName: propIndexName, // nombre de la propiedad
              pathname: pathName,
              filter: this.state.currentFilter,
            });
            context.loadedTableComponent.set(entity, true);
          }

          const resultState = result
            ? result[pathName]
              ? result[pathName][entity]
                ? result[pathName][entity]
                : undefined
              : undefined
            : undefined;
          
            const filter = resultState?resultState.filter?resultState.filter:undefined :undefined;

            const filterIds = filter?filter.filterEntity?
            Object.keys(filter.filterEntity!).reduce(
              (p: { [key: string]: string[] }, u) => ({
                ...p,
                [u]: [
                  ...(p[u] || []),
                  ...(filter.filterEntity
                    ? filter.filterEntity[Number(u)].map(s => s.value)
                    : []),
                ],
              }),
              {},
            ):undefined: undefined;

          var facetFilter =
            resultState?.facets &&
            resultState?.facets.reduce(
              (p: { [num: number]: IEntityNameId[] }, u) => ({
                ...p,
                [u.index]: [...(p[u.index] || []), { index: u.value, title: u.title } as IEntityNameId],
              }),
              {},
            );
          
          

          return (
            <TableFenix
              filters={(i,s)=>this.filters(i,s,context)}
              filtersValues={facetFilter}
              filter={this.props.filter || false}
              enumValue={this.props.enumValue}
              cellheaders={this.props.cellheaders}
              cells={this.props.cells}
              selectPage={i => this.selectPage(i, context)}
              itemPerPage={this.props.itemPerPage}
              elements={resultState}
              headerProperty={this.props.headerProperty}
              headerRelated={this.props.headerRelated}
              filtersSelected={filterIds}
              clean={()=>this.clean(context)}

            />
          );
        }
      }}
    </ctxt.Consumer>)

  }

  private clean(ctx : IFenixStoreElement){
    this.selectPage(1,ctx, {filterEntity : {}})
  }

  private filters(item: number, selecteds: string[], ctx : IFenixStoreElement){
      
      const newState = {...this.state, currentFilter : {filterEntity : {...(this.state.currentFilter.filterEntity || {}), [item]:selecteds.map(s=>({value : s } as IFilterBase<string>))}}};
      
      this.selectPage(1, ctx, newState.currentFilter);
  }

  private selectPage(item: number, ctx : IFenixStoreElement, filter:IFilterModel | undefined = undefined ){
    let { entity, result, isLoading } = this.props;
    
    this.props.onLoad &&
    this.props.onLoad({
      url: ctx.connect.searchConnect.url,
      elementsInPage: this.props.itemPerPage,
      entity,
      index: ctx.connect.searchConnect.index,
      key: ctx.connect.searchConnect.key,
      page: item,
      propIndexName: this.props.propIndexName,
      pathname: this.props.pathName,
      filter: filter ?? this.state.currentFilter,
    });

    this.setState({currentPage : item, currentFilter: filter?filter:this.state.currentFilter});
  }
  
}

