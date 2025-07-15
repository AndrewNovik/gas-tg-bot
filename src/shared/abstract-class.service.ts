export abstract class AbstractClassService<T> {
  // Общий метод для получения экземпляра
  public static getInstance<T>(): T {
    throw new Error('Method not implemented.');
  }
}
