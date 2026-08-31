/** Generated table types; only the tables this feature touches are listed. */
export interface Database {
  product_locations: {
    id: string
    tenant_id: string
    location_id: string
    baseUnitOfMeasurementCode: string
  }
  inventory_movements: {
    productLocationId: string
    date: string
    quantity: number
    unitOfMeasurementCode: string
  }
  product_uom_conversions: {
    productLocationId: string
    unitOfMeasurementCode: string
    factorToBase: number
  }
  business_exceptions: {
    productLocationId: string
    date: string
    score: number
    quantity: number
    unitOfMeasurementCode: string
  }
}
