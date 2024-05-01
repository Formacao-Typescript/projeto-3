import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { describe, it } from 'node:test'
import { Parent, ParentCreationType } from './Parent.js'
import { ZodError } from 'zod'

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
    assert.ok(parent instanceof Parent)
  })
  it('should return the correct data on toObject', () => {
    const parent = new Parent(parentObj)
    assert.deepStrictEqual(parent.toObject(), {
      ...parentObj,
      id: parent.id
    })
  })

  it('should return the correct data on toJSON', () => {
    const parent = new Parent(parentObj)
    assert.strictEqual(parent.toJSON(), JSON.stringify(parent.toObject()))
  })

  it('should return an instance of the entity with the correct data from fromObject', () => {
    const parent = Parent.fromObject(parentObj)
    assert.ok(parent instanceof Parent)
    assert.deepStrictEqual(parent.toObject(), {
      ...parentObj,
      id: parent.id
    })
  })

  it('should return an error upon invalid data', () => {
    assert.throws(() => {
      new Parent({ ...parentObj, emails: ['invalid'] })
    }, ZodError)
  })
})
