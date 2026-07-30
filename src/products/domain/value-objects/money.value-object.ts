/**
 * Money vive en shared: lo usan productos y ventas, y no pertenece a ningun
 * agregado en particular. Se reexporta desde aqui para no reescribir los
 * imports de este modulo y, sobre todo, para que exista una sola clase: dos
 * copias harian que `instanceof` fallara al cruzar de modulo.
 */
export {
  InvalidMoneyError,
  Money,
} from '../../../shared/domain/money.value-object';
