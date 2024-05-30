import { describe, it, jest, expect, beforeAll } from '@jest/globals'
import { ClassRepository } from './ClassRepository.js'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Class } from '../domain/Class.js'
import { unlinkIfExists } from '../utils/unlinkIfExists.js'

describe('ClassRepository', () => {
  const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '.data')
  const DB_FILE_NAME = 'class-test.json'
  const classEntity = new Class({
    id: 'aab75a08-159f-4622-924d-aa12128b74bf',
    code: '1B-M',
    teacher: null
  })

  beforeAll(() => {
    unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
  })

  afterEach(() => {
    unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
  })

  it('should create a new json file under .data', () => {
    void new ClassRepository()
    const dirs = readdirSync(DB_PATH)
    expect(dirs).toContain(DB_FILE_NAME)
  })

  it('should save a new entity in the database', () => {
    const db = new ClassRepository()
    db.save(classEntity)
    const list = JSON.parse(readFileSync(`${DB_PATH}/${DB_FILE_NAME}`, 'utf-8'))

    // Asserções simples
    expect(Class.fromObject(list[0][1])).toStrictEqual(classEntity)

    // SNAPSHOTS //
    // Se formos usar snapshots, temos que garantir que o objeto não vai mudar
    // Caso contrário precisamos atualizar o snapshot sempre com -u
    // Pra isso, vamos usar um ID fixo no objeto da linha 12

    // Podemos usar snapshots locais para garantir que o objeto foi salvo corretamente
    // Vantagem: Podemos ver o objeto salvo no snapshot sem precisar abrir o arquivo
    // Desvantagem: Se for um objeto grande, o arquivo vai ficar poluido
    expect(Class.fromObject(list[0][1])).toMatchInlineSnapshot(
      `"{"code":"1B-M","teacher":null,"id":"aab75a08-159f-4622-924d-aa12128b74bf"}"`
    )

    // Podemos usar o snapshot direto no arquivo de snapshot
    // Vantagem: O arquivo de teste fica limpo
    // Desvantagem: Precisamos abrir o arquivo de snapshot para ver o objeto salvo
    expect(Class.fromObject(list[0][1])).toMatchSnapshot()
  })

  it('should list all entities in the database', () => {
    const db = new ClassRepository()
    db.save(classEntity)
    const list = db.list()
    expect(list.length).toBe(1)
    expect(list[0]).toBeInstanceOf(Class)
  })

  it('should find an entity by id', () => {
    const db = new ClassRepository()
    db.save(classEntity)
    const entity = db.findById(classEntity.id)
    expect(entity).toBeInstanceOf(Class)
    expect(entity).toStrictEqual(classEntity)
    expect(entity).toMatchInlineSnapshot(`"{"code":"1B-M","teacher":null,"id":"aab75a08-159f-4622-924d-aa12128b74bf"}"`)
    expect(entity).toMatchSnapshot()
  })

  it('should update an entity in the database', () => {
    const db = new ClassRepository()
    const newClass = new Class({
      code: '1B-M',
      teacher: null
    })
    db.save(newClass)

    newClass.code = '2C-T'
    const updated = db.save(newClass).findById(newClass.id)
    expect(updated).toBeInstanceOf(Class)
    expect(updated).toStrictEqual(newClass)
  })

  it('should find an entity by an specific property', () => {
    const db = new ClassRepository()
    db.save(classEntity)
    const list = db.listBy('code', classEntity.code)
    expect(list.length).toBe(1)
    expect(list[0]).toBeInstanceOf(Class)
    expect(list[0]).toStrictEqual(classEntity)
  })

  it('should delete an entity from the database', () => {
    const db = new ClassRepository()
    db.save(classEntity)
    const list = db.list()
    expect(list.length).toBe(1)
    db.remove(classEntity.id)
    expect(db.list().length).toBe(0)
  })
})
