import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          فرم وضعیت داوطلبین ارتقاء و انتصاب
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">سامانه مدیریت فرم‌های داوطلبین</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            این سامانه برای مدیریت و ثبت اطلاعات داوطلبین ارتقاء و انتصاب به سطوح مدیریتی طراحی شده است.
            با استفاده از این سامانه می‌توانید اطلاعات کارکنان، وضعیت اداری و توانمندی‌های عملکردی آنها را ثبت و مدیریت کنید.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            href="/reports/create" 
            className="block bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow-md p-6 transition-colors"
          >
            <h3 className="text-xl font-bold mb-2">ثبت فرم جدید</h3>
            <p className="text-primary-50">
              ثبت اطلاعات داوطلب جدید
            </p>
          </Link>

          <Link 
            href="/reports" 
            className="block bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md p-6 transition-colors"
          >
            <h3 className="text-xl font-bold mb-2">مشاهده فرم‌ها</h3>
            <p className="text-green-50">
              مشاهده و مدیریت فرم‌های ثبت شده
            </p>
          </Link>

          <Link 
            href="/reports/search" 
            className="block bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md p-6 transition-colors"
          >
            <h3 className="text-xl font-bold mb-2">جستجو</h3>
            <p className="text-blue-50">
              جستجو در فرم‌های ثبت شده
            </p>
          </Link>

          <Link 
            href="/about" 
            className="block bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md p-6 transition-colors"
          >
            <h3 className="text-xl font-bold mb-2">درباره سامانه</h3>
            <p className="text-gray-50">
              اطلاعات و راهنمای استفاده
            </p>
          </Link>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>سامانه مدیریت فرم‌های داوطلبین ارتقاء و انتصاب</p>
          <p className="text-sm mt-2">نسخه 1.0.0</p>
        </div>
      </div>
    </main>
  )
}
