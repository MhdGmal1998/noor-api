import { Request, Response, NextFunction } from "express"
import { BadInputError } from "../errors/BadInputError"
import { AppDataSource } from "../infrastructure/typeorm"
import { BusinessCategoryRepository } from "../repositories/BusinessCategoryRepository"
import { CountryRepository } from "../repositories/CountryRepository"
import { SystemConfigurationRepository } from "../repositories/SystemConfigurationRepo"
import Log from "../util/Log"

export default class SystemConfigurationController {
  public async getSystemConf(req: Request, res: Response, next: NextFunction) {
    try {
      // get all configuration from the system
      // country list
      const repo = new CountryRepository(AppDataSource)
      const businessCategoryRepo = new BusinessCategoryRepository(AppDataSource)
      const countries = await repo.getAll()
      // get all business categories
      const categories = await businessCategoryRepo.getAll()
      // actual config
      const configRepo = new SystemConfigurationRepository(AppDataSource)
      const config = await configRepo.getAll()
      res.status(200).json({
        config: config.reduce((obj, item) => {
          return { ...obj, [item.key]: item.value }
        }, {}),
        countries,
        categories,
      })
      next()
    } catch (error: any) {
      Log.error(`SystemConfController.getSystemConf: ${error}`)
      res.status(error.statusCode ?? 500).send(error.message)
      next(error)
    }
  }

  public async createCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new CountryRepository(AppDataSource)
      const country = await repo.create(req.body)
      res.status(200).json(country)
      next()
    } catch (error: any) {
      Log.error(`SystemConfController.createCountry: ${error}`)
      res.status(error.statusCode ?? 500).send(error.message)
      next(error)
    }
  }

  public async updateCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new CountryRepository(AppDataSource)
      const country = await repo.update(req.body)
      res.status(200).json(country)
      next()
    } catch (error: any) {
      Log.error(`SystemConfController.updateCountry: ${error}`)
      res.status(error.statusCode ?? 500).send(error.message)
      next(error)
    }
  }

  public async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new BusinessCategoryRepository(AppDataSource)
      const category = await repo.create(req.body)
      res.status(200).json(category)
      next()
    } catch (error: any) {
      Log.error(`SystemConfController.createCategory: ${error}`)
      res.status(error.statusCode ?? 500).send(error.message)
      next(error)
    }
  }

  public async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new BusinessCategoryRepository(AppDataSource)
      const category = await repo.update(req.body)
      res.status(200).json(category)
      next()
    } catch (error: any) {
      Log.error(`SystemConfController.updateCategory: ${error}`)
      res.status(error.statusCode ?? 500).send(error.message)
      next(error)
    }
  }

  public async updateSystemConf(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { config } = req.body
      if (!config || typeof config !== "object")
        throw new BadInputError("لقد حدث خطأ ما...")
      const repo = new SystemConfigurationRepository(AppDataSource)
      const arr = []
      for (const key in config) {
        arr.push(await repo.updateByKey(key, config[key]))
      }
      res.status(200).json(arr)
      next()
    } catch (error: any) {
      Log.error(`SystemConfController.updateSystemConf: ${error}`)
      res.status(error.statusCode ?? 500).send(error.message)
      next(error)
    }
  }
}
