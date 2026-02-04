import { ShopItem } from '@/types'
import { SHOP_ITEMS } from '@/data/items'

export const getDefaultShopItems = (): ShopItem[] =>
  SHOP_ITEMS.map((item) => ({
    ...item,
  }))
