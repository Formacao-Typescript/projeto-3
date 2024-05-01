import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { describe, it } from 'node:test'
import { Class, ClassCreationType } from './Class.js'
import { ZodError } from 'zod'

describe('Class', () => {
  const classEntityObj: ClassCreationType = {
    code: '1A-M',
    teacher: randomUUID()
  }

  it('should return an instance of the entity with the correct data', () => {
    const classEntity = new Class(classEntityObj)
    assert.ok(classEntity instanceof Class)
  })
  it('should return the correct data on toObject', () => {
    const classEntity = new Class(classEntityObj)
    assert.deepStrictEqual(classEntity.toObject(), {
      ...classEntityObj,
      id: classEntity.id
    })
  })

  it('should return the correct data on toJSON', () => {
    const classEntity = new Class(classEntityObj)
    assert.strictEqual(classEntity.toJSON(), JSON.stringify(classEntity.toObject()))
  })

  it('should return an instance of the entity with the correct data from fromObject', () => {
    const classEntity = Class.fromObject(classEntityObj)
    assert.ok(classEntity instanceof Class)
    assert.deepStrictEqual(classEntity.toObject(), {
      ...classEntityObj,
      id: classEntity.id
    })
  })

  it('should return an error upon invalid data', () => {
    assert.throws(() => {
      new Class({ ...classEntityObj, code: 'invalid' })
    }, ZodError)
    assert.throws(() => {
      new Class({ ...classEntityObj, teacher: 'invalid' })
    }, ZodError)
  })
})
