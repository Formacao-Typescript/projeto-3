import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { afterEach, beforeAll, expect, describe, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { Student } from '../domain/Student.js'
import { unlinkIfExists } from '../utils/unlinkIfExists.js'
import { StudentRepository } from './StudentRepository.js'
import { randomUUID } from 'node:crypto'

describe('StudentRepository', () => {
  const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '.data')
  const DB_FILE_NAME = 'student-test.json'
  const student = new Student({
    id: 'dd5c3335-3602-436e-94a6-dbbfffd201dc',
    firstName: 'Lucas',
    surname: 'Santos',
    birthDate: new Date('1995-01-01').toISOString(),
    bloodType: 'A+',
    class: '37f67e15-0936-4881-8f67-990aa903b527',
    document: '123456789',
    parents: ['330e4e2d-2d18-4562-a61c-e06cbe4a8e8e'],
    startDate: new Date('2010-10-10').toISOString()
  })

  beforeAll(() => {
    // limpa o arquivo de teste antes de começar
    // isso garante que sempre vamos ter um único registro
    unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
  })

  // Depois de cada teste, limpa o arquivo de teste
  afterEach(() => {
    unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
  })

  it('should create a new json file under .data', () => {
    void new StudentRepository()
    const dirs = readdirSync(DB_PATH)
    expect(dirs).toContain(DB_FILE_NAME)
  })

  it('should save a new entity in the database', () => {
    const db = new StudentRepository()

    const instance = db.save(student)
    expect(instance).toBeInstanceOf(StudentRepository)

    const file = JSON.parse(readFileSync(`${DB_PATH}/${DB_FILE_NAME}`, 'utf-8'))
    expect(file[0][1]).toStrictEqual(JSON.parse(student.toJSON()))
  })

  it('should list all entities in the database', () => {
    const db = new StudentRepository()
    const list = db.save(student).list() as Student[]
    expect(list.length).toBe(1)
    expect(list[0]).toBeInstanceOf(Student)
  })

  it('should find by id', () => {
    const db = new StudentRepository()
    const found = db.save(student).findById(student.id)
    expect(found).toBeInstanceOf(Student)
    expect(found).toStrictEqual(student)
  })

  it('should update', () => {
    const db = new StudentRepository()
    const newStudent = new Student({
      firstName: 'Lucas',
      surname: 'Santos',
      birthDate: new Date('1995-01-01').toISOString(),
      bloodType: 'A+',
      class: randomUUID(),
      document: '123456789',
      parents: [randomUUID()],
      startDate: new Date('2010-10-10').toISOString()
    })
    db.save(newStudent)
    newStudent.firstName = 'Not Lucas'
    const updated = db.save(newStudent).findById(newStudent.id)
    expect(updated).toBeInstanceOf(Student)
    expect(updated).toStrictEqual(newStudent)
  })

  it('should list by a specific property', () => {
    const db = new StudentRepository()
    const list = db.save(student).listBy('surname', 'Santos') as Student[]
    expect(list.length).toBe(1)
    expect(list[0]).toBeInstanceOf(Student)
    expect(list[0]).toStrictEqual(student)
  })

  it('should remove from the database', () => {
    const db = new StudentRepository()
    db.save(student)
    expect(db.list().length).toBe(1)
    db.remove(student.id)
    const list = db.list() as Student[]
    expect(list.length).toBe(0)
  })
})
