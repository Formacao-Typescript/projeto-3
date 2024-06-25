import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { Parent, ParentCreationType } from './Parent.js'

describe('Parent', () => {
  const parentObj: ParentCreationType = {
    firstName: 'Lucas',
    surname: 'Santos',
    address: [
      {
        city: 'São Paulo',
        country: 'Brazil',
        line1: 'Rua dos Bobos',
        line2: 'Número 0',
        zipCode: '12345678'
      }
    ],
    document: '123456789',
    emails: ['foo@gmail.com'],
    phones: ['123456789']
  }

  it('should return an instance of the entity with the correct data', () => {
    const parent = new Parent(parentObj)
    expect(parent).toBeInstanceOf(Parent)
  })
  it('should return the correct data on toObject', () => {
    const parent = new Parent(parentObj)
    expect(parent.toObject()).toEqual({
      ...parentObj,
      id: parent.id
    })
  })

  it('should return the correct data on toJSON', () => {
    const parent = new Parent(parentObj)
    expect(parent.toJSON()).toEqual(JSON.stringify(parent.toObject()))
  })

  it('should return an instance of the entity with the correct data from fromObject', () => {
    const parent = Parent.fromObject(parentObj)
    expect(parent).toBeInstanceOf(Parent)
    expect(parent.toObject()).toEqual({
      ...parentObj,
      id: parent.id
    })
  })

  it('should return an error upon invalid data', () => {
    expect(() => {
      new Parent({ ...parentObj, emails: ['invalid'] })
    }).toThrow(ZodError)
  })
})
