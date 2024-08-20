type FeatureHeaderProps = React.PropsWithChildren<{
  icon: React.ReactNode;
}>;
export const FeatureHeader: React.FC<FeatureHeaderProps> = ({
  icon,
  ...props
}) => (
  <div className="flex items-center gap-[10px] pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
    <div className="w-[32px] min-w-[32px] h-[32px] rounded-full bg-[#1E293B] dark:bg-[#6EE7B7] text-white dark:text-[#0F172A] flex items-center justify-center">
      {icon}
    </div>
    <h1
      className="text-3xl tracking-tighter font-medium text-[#1E293B] dark:text-[#6EE7B7]"
      {...props}
    />
  </div>
);
